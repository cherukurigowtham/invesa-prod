/**
 * shared/lib/api/postsApi.ts
 * Idea feed posts: get, create, and like/unlike.
 */

import client from './client';
import type { IdeaPost } from './types';

export const postsApi = {
  async getPosts(ideaId?: string): Promise<IdeaPost[]> {
    const url = ideaId ? `/ideas/${ideaId}/posts` : '/feed';
    const res = await client.get(url);
    return res.data;
  },

  async createPost(
    ideaId: string,
    data: {
      postType: 'update' | 'milestone' | 'media' | 'announcement';
      content: string;
      mediaUrl?: string;
    },
  ): Promise<IdeaPost> {
    const res = await client.post(`/ideas/${ideaId}/posts`, data);
    return res.data;
  },

  async likePost(postId: string): Promise<IdeaPost> {
    const res = await client.post(`/posts/${postId}/like`);
    return res.data;
  },
};
