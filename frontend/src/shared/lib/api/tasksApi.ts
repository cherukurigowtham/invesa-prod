/**
 * shared/lib/api/tasksApi.ts
 * Kanban Board Tasks management.
 */

import client from './client';
import type { Task } from './types';

export const tasksApi = {
  async getTasks(ideaId: string): Promise<Task[]> {
    const res = await client.get(`/ideas/${ideaId}/tasks`);
    return res.data;
  },

  async createTask(ideaId: string, data: {
    title: string;
    description?: string;
    status?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    position?: number;
  }): Promise<Task> {
    const res = await client.post(`/ideas/${ideaId}/tasks`, data);
    return res.data;
  },

  async updateTask(ideaId: string, taskId: string, data: {
    title: string;
    description?: string;
    status: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    position: number;
  }): Promise<Task> {
    const res = await client.put(`/ideas/${ideaId}/tasks/${taskId}`, data);
    return res.data;
  },

  async deleteTask(ideaId: string, taskId: string): Promise<void> {
    await client.delete(`/ideas/${ideaId}/tasks/${taskId}`);
  },
};
