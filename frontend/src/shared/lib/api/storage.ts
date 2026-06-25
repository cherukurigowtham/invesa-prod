/**
 * shared/lib/api/storage.ts
 * LocalStorage offline action queue.
 */

import type { QueuedSyncAction } from './types';

// ─── Offline sync queue ───────────────────────────────────────────────────────

export function getSyncQueue(): QueuedSyncAction[] {
  return JSON.parse(localStorage.getItem('invesa_sync_queue') || '[]');
}

export function saveSyncQueue(queue: QueuedSyncAction[]): void {
  localStorage.setItem('invesa_sync_queue', JSON.stringify(queue));
}

export function queueAction(action: QueuedSyncAction['action'], payload: any): void {
  const queue = getSyncQueue();
  queue.push({
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    action,
    payload,
    createdAt: new Date().toISOString(),
  });
  saveSyncQueue(queue);
  window.dispatchEvent(new Event('invesa_sync_queue_changed'));
}
