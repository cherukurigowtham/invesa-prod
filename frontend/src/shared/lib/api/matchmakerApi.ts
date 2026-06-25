/**
 * shared/lib/api/matchmakerApi.ts
 * Skill-based matchmaking for founders, builders, and investors.
 */

import client from './client';
import { authApi } from './authApi';
import type { MatchmakerRes } from './types';

export const matchmakerApi = {
  async getMatchmaker(): Promise<MatchmakerRes> {
    const user = authApi.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const res = await client.get('/matchmaker');
    return res.data;
  },
};
