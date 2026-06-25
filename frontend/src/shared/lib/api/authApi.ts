/**
 * shared/lib/api/authApi.ts
 * Authentication API: register, login, forgot/reset password, session helpers.
 */

import client from './client';
import type { User, UserRole } from './types';

export const authApi = {
  async register(data: {
    name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    bio?: string;
    skills?: string[];
    linkedin?: string;
    recovery_key_hash: string;
  }): Promise<{ token: string; user: User }> {
    const res = await client.post('/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('invesa_token', token);
    localStorage.setItem('invesa_user', JSON.stringify(user));
    return res.data;
  },

  async login(data: {
    email: string;
    password_hash: string;
  }): Promise<{ token: string; user: User }> {
    const res = await client.post('/auth/login', data);
    const { token, user } = res.data;
    localStorage.setItem('invesa_token', token);
    localStorage.setItem('invesa_user', JSON.stringify(user));
    return res.data;
  },

  async forgotPassword(
    email: string,
  ): Promise<{ message: string }> {
    const res = await client.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: {
    email: string;
    recovery_key_hash?: string;
    newPasswordHash: string;
    byPasskey?: boolean;
  }): Promise<{ message: string }> {
    const res = await client.post('/auth/reset-password', data);
    return res.data;
  },

  async checkEmailPasskeyStatus(email: string): Promise<{ registered: boolean }> {
    const isRegistered = localStorage.getItem(`invesa_passkey_registered_${email.toLowerCase()}`) === 'true';
    return { registered: isRegistered };
  },

  async registerPasskey(credential: { credentialId: string; publicKey: string }): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    localStorage.setItem(`invesa_passkey_registered_${user.email.toLowerCase()}`, 'true');

    const updatedData = {
      passkeyRegistered: true,
      passkeyCredentialId: credential.credentialId,
      passkeyPublicKey: credential.publicKey,
    };

    return this.updateProfile(updatedData);
  },

  async removePasskey(): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    localStorage.removeItem(`invesa_passkey_registered_${user.email.toLowerCase()}`);

    const updatedData = {
      passkeyRegistered: false,
      passkeyCredentialId: undefined,
      passkeyPublicKey: undefined,
    };

    return this.updateProfile(updatedData);
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('invesa_user');
    return raw ? (JSON.parse(raw) as User) : null;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const updatedUser: User = {
      ...user,
      ...data,
      preferences: {
        ...(user.preferences || {}),
        ...(data.preferences || {})
      }
    };

    try {
      const res = await client.patch('/auth/profile', data);
      const serverUser = res.data;
      localStorage.setItem('invesa_user', JSON.stringify(serverUser));
      window.dispatchEvent(new Event('invesa_user_updated'));
      return serverUser;
    } catch (err: any) {
      // Fallback for settings (density, biometric flags) that are local-only
      localStorage.setItem('invesa_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('invesa_user_updated'));
      return updatedUser;
    }
  },

  logout(): void {
    localStorage.removeItem('invesa_token');
    localStorage.removeItem('invesa_user');
  },
};
