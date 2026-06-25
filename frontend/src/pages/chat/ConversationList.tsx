/**
 * ConversationList.tsx
 *
 * Renders the active conversations / channels list side column
 * with search filtering.
 */

import { MessageSquare, Hash } from 'lucide-react';
import type { Conversation } from '../../shared/lib/api';

interface ConversationListProps {
  conversations: Conversation[];
  activePartner: any;
  chatSearch: string;
  setChatSearch: (s: string) => void;
  selectPartner: (p: any) => void;
  getPartnerInitials: (name: string) => string;
  getRoleAccent: (role: string) => string;
}

export default function ConversationList({
  conversations,
  activePartner,
  chatSearch,
  setChatSearch,
  selectPartner,
  getPartnerInitials,
  getRoleAccent
}: ConversationListProps) {
  return (
    <div className={`${activePartner ? 'hidden md:flex' : 'flex'} md:col-span-4 border-r border-white/5 p-4 flex-col gap-4 overflow-y-auto`}>
      <h2 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
        Channels ({conversations.length})
      </h2>

      {/* Sidebar search filter */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search chats..."
          value={chatSearch}
          onChange={(e) => setChatSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-white placeholder-white/35 focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
      </div>

      {conversations.length > 0 ? (
        <div className="space-y-2 flex-1">
          {conversations
            .filter(c => c.name.toLowerCase().includes(chatSearch.toLowerCase()))
            .map((c) => (
              <button
                key={c.userId}
                onClick={() => selectPartner({ id: c.userId, name: c.name, role: c.role })}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex gap-2.5 items-center ${
                  activePartner?.id === c.userId 
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-white' 
                    : 'bg-white/[0.01] border-white/5 text-white/60 hover:bg-white/[0.03] hover:border-white/10'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white/80 text-xs flex-shrink-0">
                  {c.role === 'channel' ? (
                    <Hash className="w-4 h-4 text-indigo-400" />
                  ) : (
                    getPartnerInitials(c.name)
                  )}
                </div>
                <div className="truncate flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-white text-xs truncate">
                      {c.role === 'channel' ? `# ${c.name}` : c.name}
                    </span>
                    <span className={`text-[8px] uppercase font-bold px-1 py-0.5 rounded border ${getRoleAccent(c.role)}`}>
                      {c.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/45 truncate mt-0.5">{c.lastMessage || 'No messages yet.'}</p>
                </div>
              </button>
            ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/40 text-[11px] leading-relaxed">
          <MessageSquare className="w-6 h-6 text-indigo-500/40 mb-2" />
          No active conversations yet. Visit the Matches page to start chats.
        </div>
      )}
    </div>
  );
}
