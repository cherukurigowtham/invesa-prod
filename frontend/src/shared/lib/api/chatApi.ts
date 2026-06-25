/**
 * shared/lib/api/chatApi.ts
 * Chat conversations, message history, WebSocket URL, and offline sync.
 */

import client from './client';
import { API_BASE } from './client';
import { matchmakerApi } from './matchmakerApi';
import { authApi } from './authApi';
import type { Conversation, ChatMessage, User } from './types';

export const chatApi = {
  async getChatConversations(): Promise<Conversation[]> {
    const user = authApi.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    try {
      const res = await client.get('/chat/conversations');
      const apiConversations: Conversation[] = res.data;

      try {
        const matches = await matchmakerApi.getMatchmaker();
        const matchUsers: User[] = [];

        if (user.role === 'founder' && matches.builderMatches) {
          matchUsers.push(...matches.builderMatches.map((m) => m.builder));
        } else if (user.role === 'builder' && matches.ideaMatches) {
          for (const m of matches.ideaMatches) {
            matchUsers.push({
              id: m.idea.founderId,
              name: m.founderName || 'Founder',
              email: '',
              role: 'founder',
              bio: '',
              createdAt: '',
            });
          }
        } else if (user.role === 'investor' && matches.ideaMatches) {
          for (const m of matches.ideaMatches) {
            matchUsers.push({
              id: m.idea.founderId,
              name: m.founderName || 'Founder',
              email: '',
              role: 'founder',
              bio: '',
              createdAt: '',
            });
          }
        }

        // De-duplicate matchUsers by id
        const uniqueMatchUsers = matchUsers.filter((u, index, self) =>
          self.findIndex((other) => other.id === u.id) === index
        );

        // Merge matched users who don't have chat history yet
        const merged = [...apiConversations];
        for (const mu of uniqueMatchUsers) {
          if (!merged.some((c) => c.userId === mu.id)) {
            merged.push({
              userId: mu.id,
              name: mu.name,
              role: mu.role,
              lastMessage: 'No messages yet.',
              lastMessageTime: new Date().toISOString(),
            });
          }
        }
        return merged;
      } catch (matchErr) {
        console.error('Failed to merge matches into conversations list:', matchErr);
        return apiConversations;
      }
    } catch (err: any) {
      return [];
    }
  },

  async getChatHistory(withUserId: string): Promise<ChatMessage[]> {
    const res = await client.get(`/chat/history/${withUserId}`);
    return res.data;
  },

  getWebSocketUrl(): string {
    const token    = localStorage.getItem('invesa_token') || '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host       = 'localhost:7860';
    if (API_BASE.startsWith('http')) {
      try {
        host = new URL(API_BASE).host;
      } catch {
        host = 'localhost:7860';
      }
    }
    return `${protocol}//${host}/v1/chat/ws?token=${encodeURIComponent(token)}`;
  },

  async getTeamMeetings(): Promise<Conversation[]> {
    const res = await client.get('/team-meetings');
    return res.data;
  },
};
