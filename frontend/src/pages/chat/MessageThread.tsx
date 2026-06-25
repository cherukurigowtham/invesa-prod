/**
 * MessageThread.tsx
 *
 * Renders the active message thread log, partner info header, and typing indicator.
 */

import type { RefObject } from 'react';
import { ArrowLeft, User as UserIcon, Hash, Sparkles } from 'lucide-react';
import type { ChatMessage, Idea, User } from '../../shared/lib/api';

interface MessageThreadProps {
  activePartner: any;
  activeProject: Idea | null;
  messages: ChatMessage[];
  user: User | null;
  isPartnerTyping: boolean;
  typingUserName?: string;
  messageEndRef: RefObject<HTMLDivElement | null>;
  getSenderInfo: (senderId: string) => { name: string; role: string };
  getRoleAccent: (role: string) => string;
  onBack: () => void;
}

export default function MessageThread({
  activePartner,
  activeProject,
  messages,
  user,
  isPartnerTyping,
  typingUserName,
  messageEndRef,
  getSenderInfo,
  getRoleAccent,
  onBack
}: MessageThreadProps) {
  return (
    <div className="flex-1 flex flex-col justify-between min-h-[400px]">
      {/* Active Partner Info header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/15">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white cursor-pointer mr-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            {activePartner.role === 'channel' ? (
              <Hash className="w-5 h-5 text-indigo-400" />
            ) : (
              <UserIcon className="w-5 h-5 text-white/70" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-tight">
              {activePartner.role === 'channel' ? `# ${activePartner.name}` : activePartner.name}
            </h3>
            {activePartner.role === 'channel' ? (
              <div className="text-[10px] text-indigo-300 font-medium truncate mt-0.5">
                Team: {activeProject ? [
                  `${activeProject.founderName} (Founder)`,
                  ...(activeProject.teamMembers || []).filter(m => m.userId !== activeProject.founderId).map(m => `${m.name} (${m.roleTitle})`)
                ].join(', ') : 'Loading team...'}
              </div>
            ) : (
              <span className={`text-[9px] px-2 py-0.5 border rounded uppercase font-bold inline-block mt-1 ${getRoleAccent(activePartner.role)}`}>
                {activePartner.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages feed list */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[350px]">
        {messages.length > 0 ? (
          messages.map((m) => {
            const isMe = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {activePartner.role === 'channel' && !isMe && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-white/80">
                      {getSenderInfo(m.senderId).name}
                    </span>
                    <span className="text-[8px] px-1 py-0.2 bg-white/5 border border-white/10 text-white/40 rounded font-semibold uppercase tracking-wider">
                      {getSenderInfo(m.senderId).role}
                    </span>
                  </div>
                )}
                <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isMe 
                    ? 'bg-indigo-500 text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 text-white/85 rounded-tl-none'
                }`}>
                  <p>{m.message}</p>
                  <span className="text-[9px] text-white/40 block text-right mt-1.5 font-mono">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/30 text-xs gap-2 py-10">
            <Sparkles className="w-6 h-6 text-indigo-400/40" />
            <span>This is the start of your message history.</span>
          </div>
        )}
        {isPartnerTyping && (
          <div className="flex items-center gap-1.5 px-1 py-1 animate-pulse">
            <span className="text-[10px] text-white/40 italic">
              {activePartner.role === 'channel' ? (typingUserName || 'Someone') : activePartner.name} is typing
            </span>
            <div className="flex gap-0.5 items-center mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>
    </div>
  );
}
