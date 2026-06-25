import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService, type ChatMessage, type Conversation, type User, type Idea, queueAction } from '../shared/lib/api';
import { MessageSquare, Sparkles } from 'lucide-react';

import ConversationList from './chat/ConversationList';
import MessageThread from './chat/MessageThread';
import ChatInput from './chat/ChatInput';

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('with');

  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<any | null>(null);
  const [activeProject, setActiveProject] = useState<Idea | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatSearch, setChatSearch] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Simulates partner typing indicator on partner switch
  useEffect(() => {
    if (!activePartner) {
      setIsPartnerTyping(false);
      return;
    }
    setIsPartnerTyping(true);
    const timer = setTimeout(() => {
      setIsPartnerTyping(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [activePartner]);

  // Authenticate user
  useEffect(() => {
    const currentUser = apiService.getCurrentUser();
    if (!currentUser) {
      navigate('/login?redirect=/chat');
      return;
    }
    setUser(currentUser);
    loadConversations();
  }, []);

  // Fetch conversations list
  const loadConversations = async () => {
    try {
      const list = await apiService.getChatConversations();
      
      // Load active project channels
      const currentUser = apiService.getCurrentUser();
      let mergedList = [...list];
      if (currentUser) {
        try {
          const projectConversations = await apiService.getTeamMeetings();
          mergedList = [...projectConversations, ...list];
        } catch (e) {
          console.error('Failed to load project channels', e);
        }
      }
      
      setConversations(mergedList);

      // If "with" query param exists, verify and select active partner if not already active
      if (targetUserId && (!activePartner || activePartner.id !== targetUserId)) {
        const existing = mergedList.find(c => c.userId === targetUserId);
        if (existing) {
          selectPartner({ id: existing.userId, name: existing.name, role: existing.role } as User);
        } else {
          // Fetch user details for the new conversation partner
          try {
            const res = await apiService.getUserProfile(targetUserId);
            if (res && res.user) {
              selectPartner(res.user);
            }
          } catch (err) {
            console.error('Failed to load profile for new chat partner', err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  // Select partner and load history
  const selectPartner = async (partner: any) => {
    setActivePartner(partner);
    setSearchParams({ with: partner.id });
    
    if (partner.role === 'channel') {
      try {
        const ideaDetail = await apiService.getIdeaById(partner.id);
        setActiveProject(ideaDetail);
      } catch (err) {
        console.error('Failed to load project details for channel', err);
      }
    } else {
      setActiveProject(null);
    }

    try {
      const history = await apiService.getChatHistory(partner.id);
      setMessages(history);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keep track of activePartner and loadConversations via Refs to prevent stale closures in the WebSocket effect
  const activePartnerRef = useRef<any | null>(null);
  const loadConversationsRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);

  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);

  // Handle WebSocket lifecycle
  useEffect(() => {
    if (!user) return;

    let active = true;
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      if (!active) return;
      const wsUrl = apiService.getWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!active) {
          ws.close();
          return;
        }
        console.log('🔒 WebSocket connection opened successfully.');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const incomingMsg: ChatMessage = JSON.parse(event.data);
          
          if (incomingMsg.message.startsWith('{"event":')) {
            try {
              const eventData = JSON.parse(incomingMsg.message);
              if (eventData.event === 'tasks_changed') {
                window.dispatchEvent(new CustomEvent('invesa_task_update', { detail: eventData }));
              }
            } catch (e) {
              console.error('Failed to parse websocket event message:', e);
            }
            return;
          }

          // If message belongs to active partner, append it (and de-duplicate/remove optimistic message)
          const currentPartner = activePartnerRef.current;
          if (currentPartner && (incomingMsg.senderId === currentPartner.id || incomingMsg.receiverId === currentPartner.id)) {
            setMessages(prev => {
              if (prev.some(m => m.id === incomingMsg.id)) return prev;
              const filtered = prev.filter(m => !(m.id.startsWith('msg-sent-') && m.message === incomingMsg.message));
              return [...filtered, incomingMsg];
            });
          }

          // Refresh conversations list to update previews
          loadConversationsRef.current();
        } catch (err) {
          console.error('Failed to parse incoming WS message', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (active) {
          console.warn('⚠️ WebSocket disconnected. Reconnecting in 3 seconds...');
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      };

      socketRef.current = ws;
    };

    connectWebSocket();

    return () => {
      active = false;
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [user]);

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activePartner || !user) return;

    const payload = {
      receiverId: activePartner.id,
      message: typedMessage,
    };

    // Optimistically add message to UI
    const optimisticMsg: ChatMessage = {
      id: `msg-sent-${Date.now()}`,
      senderId: user.id,
      receiverId: activePartner.id,
      message: typedMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    if (socketRef.current && wsConnected) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      queueAction('send_chat_message', payload);
      
      const savedMessages = JSON.parse(localStorage.getItem('invesa_chat_messages') || '[]');
      savedMessages.push(optimisticMsg);
      localStorage.setItem('invesa_chat_messages', JSON.stringify(savedMessages));
      
      loadConversations();
    }

    setTypedMessage('');
  };

  const getRoleAccent = (role: string) => {
    switch (role) {
      case 'founder': return 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10';
      case 'builder': return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
      case 'investor': return 'border-amber-500/30 text-amber-400 bg-amber-500/10';
      case 'channel': return 'border-indigo-400/30 text-indigo-300 bg-indigo-400/10';
      default: return 'border-white/10 text-white/50 bg-white/5';
    }
  };

  const getPartnerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  };

  const getSenderInfo = (senderId: string) => {
    if (senderId === user?.id) {
      return { name: 'Me', role: 'You' };
    }
    if (activeProject) {
      if (senderId === activeProject.founderId) {
        return { name: activeProject.founderName, role: 'Founder' };
      }
      const member = activeProject.teamMembers?.find(m => m.userId === senderId);
      if (member) {
        return { name: member.name, role: member.roleTitle };
      }
    }
    const conv = conversations.find(c => c.userId === senderId);
    if (conv) {
      return { name: conv.name, role: conv.role };
    }
    return { name: 'Team Member', role: 'Builder' };
  };

  const handleBack = () => {
    setActivePartner(null);
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-default flex items-center justify-center text-white/50 text-sm">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative flex flex-col">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col">
        
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Chat
              </h1>
              <p className="text-white/40 text-xs mt-0.5">
                Message matched partners in real-time.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider whitespace-nowrap">
              {wsConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Chat Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden min-h-[500px]">
          
          {/* Active Conversations Sidebar */}
          <ConversationList
            conversations={conversations}
            activePartner={activePartner}
            chatSearch={chatSearch}
            setChatSearch={setChatSearch}
            selectPartner={selectPartner}
            getPartnerInitials={getPartnerInitials}
            getRoleAccent={getRoleAccent}
          />

          {/* Conversation Screen */}
          <div className={`${!activePartner ? 'hidden md:flex' : 'flex'} md:col-span-8 flex-col justify-between min-h-[400px]`}>
            {activePartner ? (
              <>
                <MessageThread
                  activePartner={activePartner}
                  activeProject={activeProject}
                  messages={messages}
                  user={user}
                  isPartnerTyping={isPartnerTyping}
                  messageEndRef={messageEndRef}
                  getSenderInfo={getSenderInfo}
                  getRoleAccent={getRoleAccent}
                  onBack={handleBack}
                />
                <ChatInput
                  typedMessage={typedMessage}
                  setTypedMessage={setTypedMessage}
                  onSubmit={handleSendMessage}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/30 text-xs">
                <Sparkles className="w-8 h-8 text-indigo-400/40 mb-3 animate-pulse" />
                Select a contact from the list to start messaging.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
