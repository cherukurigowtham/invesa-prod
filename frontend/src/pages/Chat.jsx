import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const Chat = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        try {
            // Fetch all messages involving current user to group them
            // This is inefficient but works without a dedicated endpoint
            const response = await api.get(`/messages?user1=${currentUser.id}&user2=${currentUser.id}&limit=500`);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
            setLoading(false);
        }
    };

    // Initial load: fetch all messages to build conversation list
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        fetchConversations();
    }, [currentUser]);

    // Check query param for initial selected user
    useEffect(() => {
        const userId = searchParams.get('user');
        if (userId && conversations.length > 0) {
            const user = conversations.find(c => c.id === userId);
            if (user) {
                setSelectedUser(user);
            } else {
                // If not in list (new chat?), we might need to fetch user details or just start empty
                // For now, let's assume we can chat if we have the ID.
                // We fake a user object if not found in cache
                if (userId !== currentUser.id) {
                    setSelectedUser({ id: userId, username: 'User ' + userId.slice(0, 8) }); // Fallback
                }
            }
        }
    }, [searchParams, conversations]);

    // Fetch messages when selectedUser changes
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages?user1=${currentUser.id}&user2=${selectedUser.id}`);
                setMessages(response.data.items || []);
                scrollToBottom();
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [selectedUser, currentUser.id]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            await api.post('/messages', {
                sender_id: currentUser.id,
                receiver_id: selectedUser.id,
                content: newMessage
            });
            setNewMessage('');
            // Manually fetch or wait for poll
            const response = await api.get(`/messages?user1=${currentUser.id}&user2=${selectedUser.id}`);
            setMessages(response.data.items || []);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-4rem)] flex pt-20">
            <div className="w-full max-w-4xl mx-auto border border-gray-800 rounded-xl bg-[#0a0a0a] flex overflow-hidden h-[80vh]">

                {/* Sidebar (Conversations) - Placeholder if we can't fetch list */}
                <div className="w-1/3 border-r border-gray-800 bg-[#111] flex flex-col">
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="font-semibold text-white">Chats</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {/* We can't list chats easily without backend change. 
                            If selectedUser is set from URL, show it.
                        */}
                        {selectedUser && (
                            <div className="p-3 mb-2 rounded-lg bg-gray-800 cursor-pointer">
                                <p className="font-medium text-white">{selectedUser.username || 'Current Chat'}</p>
                            </div>
                        )}
                        {!selectedUser && (
                            <p className="text-sm text-gray-500 p-2">Select a business from Home to chat.</p>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-[#0a0a0a]">
                    {selectedUser ? (
                        <>
                            <div className="p-4 border-b border-gray-800 bg-[#111]">
                                <h3 className="font-semibold text-white">{selectedUser.username || 'Chat'}</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${isMe ? 'bg-primary text-black' : 'bg-gray-800 text-gray-200'}`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <span className="text-[10px] opacity-70 block text-right mt-1">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSend} className="p-4 border-t border-gray-800 bg-[#111] flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-900 border-gray-700 text-white"
                                />
                                <Button type="submit">Send</Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            Select a chat to start messaging
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
