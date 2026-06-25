/**
 * ChatInput.tsx
 *
 * Renders the text field form for composing and sending messages.
 */

import React from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  typedMessage: string;
  setTypedMessage: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ChatInput({ typedMessage, setTypedMessage, onSubmit }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="p-4 border-t border-white/5 bg-black/15 flex gap-3">
      <input
        type="text"
        required
        placeholder="Type a message..."
        value={typedMessage}
        onChange={(e) => setTypedMessage(e.target.value)}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white placeholder-white/35 focus:outline-none focus:border-indigo-500 transition-colors"
      />
      <button
        type="submit"
        className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white cursor-pointer hover:bg-indigo-600 transition-colors flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
