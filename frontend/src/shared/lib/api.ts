/**
 * shared/lib/api.ts  ← SHIM (do not add logic here)
 *
 * This file is kept for backward-compatible imports.
 * All implementation now lives in the `api/` directory:
 *
 *   api/types.ts          — TypeScript interfaces
 *   api/client.ts         — axios instance
 *   api/storage.ts        — localStorage helpers + sync queue
 *   api/mockData.ts       — seed data + analysis generator
 *   api/l2.ts             — L2 receipt helper
 *   api/authApi.ts        — auth endpoints
 *   api/ideasApi.ts       — ideas CRUD + join/interest/dashboard
 *   api/analysisApi.ts    — idea analysis
 *   api/postsApi.ts       — feed posts
 *   api/matchmakerApi.ts  — skill-based matchmaking
 *   api/simulationsApi.ts — cap-table simulations
 *   api/chatApi.ts        — chat, WebSocket, offline sync
 *   api/index.ts          — merged barrel + legacy apiService façade
 */
export * from './api/index';
