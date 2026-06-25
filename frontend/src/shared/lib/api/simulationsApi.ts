/**
 * shared/lib/api/simulationsApi.ts
 * Cap-table simulation persistence: save, get, delete.
 */

import client from './client';
import { authApi } from './authApi';
import type { SavedSimulation } from './types';

type SimInput = {
  ideaId?: string;
  title: string;
  preMoneyValuation: number;
  raiseAmount: number;
  optionPoolPercent: number;
  coFounderPercent: number;
  seriesAValuation?: number;
  seriesARaise?: number;
  seriesAOptionPool?: number;
  vestingMonths?: number;
  antiDilutionType?: string;
  redistributeUnvested?: boolean;
};

export const simulationsApi = {
  async saveSimulation(data: SimInput): Promise<SavedSimulation> {
    const user = authApi.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const res = await client.post('/simulations', data);
    return res.data;
  },

  async getSimulations(): Promise<SavedSimulation[]> {
    const user = authApi.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const res = await client.get('/simulations');
    return res.data;
  },

  async getSimulationByIdea(ideaId: string): Promise<SavedSimulation | null> {
    try {
      const res = await client.get(`/simulations/idea/${ideaId}`);
      return res.data;
    } catch {
      return null;
    }
  },

  async deleteSimulation(simId: string): Promise<void> {
    const user = authApi.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    await client.delete(`/simulations/${simId}`);
  },
};
