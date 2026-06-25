/**
 * shared/lib/api/analysisApi.ts
 * Idea analysis: fetch and generate analysis for an idea.
 */

import client from './client';
import type { IdeaAnalysis } from './types';

export const analysisApi = {
  async getIdeaAnalysis(ideaId: string): Promise<IdeaAnalysis | null> {
    const res = await client.get(`/ideas/${ideaId}/analysis`);
    return res.data;
  },

  async analyzeIdea(ideaId: string): Promise<IdeaAnalysis> {
    const res = await client.post(`/ideas/${ideaId}/analysis`);
    return res.data;
  },
};
