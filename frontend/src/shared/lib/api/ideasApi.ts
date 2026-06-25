/**
 * shared/lib/api/ideasApi.ts
 * Ideas CRUD, join requests, investor interest, dashboard data, user profiles.
 */

import client from './client';
import { authApi } from './authApi';
import type { Idea, JoinRequest, InvestorInterest } from './types';

export const ideasApi = {
  async getIdeas(category?: string, search?: string): Promise<Idea[]> {
    const res = await client.get('/ideas', { params: { category, search } });
    return res.data;
  },

  async getIdeaById(id: string): Promise<Idea> {
    const res = await client.get(`/ideas/${id}`);
    return res.data;
  },

  async createIdea(data: {
    title: string;
    summary: string;
    description: string;
    category: string;
    stage: string;
    teamSlots: string[];
  }): Promise<Idea> {
    const user = authApi.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const bytes     = new TextEncoder().encode(data.description);
    const buf       = await crypto.subtle.digest('SHA-256', bytes);
    const ipHash    = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const res = await client.post('/ideas', {
      ...data,
      ipHash,
      team_slots: data.teamSlots,
      ip_hash:    ipHash,
    });
    return res.data;
  },

  async requestToJoin(ideaId: string, message: string): Promise<JoinRequest> {
    const user = authApi.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const res = await client.post(`/ideas/${ideaId}/join`, { message });
    return res.data;
  },

  async expressInterest(ideaId: string, note: string): Promise<InvestorInterest> {
    const user = authApi.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const res = await client.post(`/ideas/${ideaId}/interest`, { note });
    return res.data;
  },

  async handleJoinRequest(
    ideaId: string,
    requestId: string,
    accept: boolean,
  ): Promise<Idea> {
    const res = await client.patch(
      `/ideas/${ideaId}/requests/${requestId}`,
      { status: accept ? 'accepted' : 'rejected' },
    );
    return res.data;
  },

  async getDashboardData(): Promise<any> {
    const user = authApi.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const res = await client.get('/dashboard');
    return res.data;
  },

  async getUserProfile(
    userId: string,
  ): Promise<{ user: any; ideas?: Idea[] }> {
    const res = await client.get(`/profile/${userId}`);
    return res.data;
  },
};
