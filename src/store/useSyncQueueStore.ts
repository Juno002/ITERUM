import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { dbService } from '../services/dbService';

export type SyncTarget = 'task' | 'habit' | 'habit_log' | 'objective' | 'journal';
export type SyncAction = 'create' | 'update' | 'delete';

export interface SyncOperation {
  id: string; // Internal queue ID
  target: SyncTarget;
  action: SyncAction;
  payload: any; // The entity data
  entityId?: string; // For updates/deletes
  userId: string;
  retryCount: number;
  timestamp: number;
}

interface SyncQueueState {
  queue: SyncOperation[];
  isSyncing: boolean;
  enqueue: (target: SyncTarget, action: SyncAction, userId: string, payload: any, entityId?: string) => void;
  dequeue: (id: string) => void;
  flush: () => Promise<void>;
  clear: () => void;
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,

      enqueue: (target, action, userId, payload, entityId) => {
        const operation: SyncOperation = {
          id: crypto.randomUUID(),
          target,
          action,
          userId,
          payload,
          entityId,
          retryCount: 0,
          timestamp: Date.now()
        };
        
        // Remove older updates/deletes for the EXACT same entity to prevent redundant calls
        set((state) => {
          const filtered = state.queue.filter(op => {
             if (op.target !== target) return true;
             // If we're enqueuing a delete, remove all previous pending updates for this entity
             if (action === 'delete' && op.entityId === entityId) return false;
             // If we're updating, maybe just enqueue sequentially. Sequential is safer.
             return true; 
          });
          return { queue: [...filtered, operation] };
        });
        
        // Attempt a background flush if online
        if (navigator.onLine) {
          get().flush();
        }
      },

      dequeue: (id) => {
        set((state) => ({
          queue: state.queue.filter(op => op.id !== id)
        }));
      },

      flush: async () => {
        const state = get();
        if (state.isSyncing || state.queue.length === 0) return;
        
        set({ isSyncing: true });
        
        const queue = [...state.queue]; // Snapshot
        
        for (const op of queue) {
          try {
            switch (op.target) {
              case 'objective':
                if (op.action === 'create') await dbService.createObjective(op.userId, op.payload);
                if (op.action === 'update' && op.entityId) await dbService.updateObjective(op.userId, op.entityId, op.payload);
                if (op.action === 'delete' && op.entityId) await dbService.deleteObjective(op.userId, op.entityId);
                break;
              case 'journal':
                if (op.action === 'create') await dbService.createJournal(op.userId, op.payload);
                if (op.action === 'delete' && op.entityId) await dbService.deleteJournal(op.userId, op.entityId);
                break;
              // We will add task and habit logic soon
            }
            // Success, remove from queue
            get().dequeue(op.id);
          } catch (e: any) {
            console.error(`[SyncQueue] Failed to ${op.action} ${op.target}:`, e);
            // Increment retry count
            set(s => ({
              queue: s.queue.map(qOp => qOp.id === op.id ? { ...qOp, retryCount: qOp.retryCount + 1 } : qOp)
            }));
            // Break loop if we lose connection during flush
            if (!navigator.onLine) break;
          }
        }
        
        set({ isSyncing: false });
      },
      
      clear: () => set({ queue: [] })
    }),
    {
      name: 'iterum_sync_queue',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
