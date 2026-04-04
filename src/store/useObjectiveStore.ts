import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Objective } from '../types';
import { dbService } from '../services/dbService';
import { useUserStore } from './useUserStore';

interface ObjectiveState {
  objectives: Objective[];
  loadObjectives: (userId: string) => Promise<void>;
  addObjective: (objectiveData: Omit<Objective, 'id' | 'isActive' | 'createdAt'>) => void;
  updateObjective: (id: string, updates: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;
  setObjectives: (objectives: Objective[]) => void;
}

export const useObjectiveStore = create<ObjectiveState>()(
  persist(
    (set, get) => ({
      objectives: [],

      loadObjectives: async (userId) => {
        try {
          const objectives = await dbService.getObjectives(userId);
          set({
            objectives: objectives.map((o: any) => ({
              ...o,
              createdAt: new Date(o.created_at),
              deadline: o.deadline ? new Date(o.deadline) : undefined,
              isActive: o.is_active,
              milestones: o.milestones?.map((m: any) => ({
                ...m,
                completedAt: m.completed_at ? new Date(m.completed_at) : undefined,
              })),
            })),
          });
        } catch (error) {
          console.error('Failed to load objectives:', error);
        }
      },

      addObjective: (objectiveData) => {
        const userId = useUserStore.getState().userId;
        const newObjective: Objective = {
          ...objectiveData,
          id: crypto.randomUUID(),
          isActive: true,
          createdAt: new Date(),
        };
        set((state) => ({ objectives: [...state.objectives, newObjective] }));

        if (userId) {
          dbService.createObjective(userId, newObjective).catch(console.error);
        }
      },

      updateObjective: (id, updates) => {
        const userId = useUserStore.getState().userId;
        set((state) => ({
          objectives: state.objectives.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));

        // Note: Relational update for objectives/milestones is complex,
        // for now we only support basic field updates or full sync.
        // if (userId) dbService.updateObjective(userId, id, updates).catch(console.error);
      },

      deleteObjective: (id) => {
        const userId = useUserStore.getState().userId;
        set((state) => ({
          objectives: state.objectives.filter((o) => o.id !== id),
        }));
        // if (userId) dbService.deleteObjective(userId, id).catch(console.error);
      },
      setObjectives: (objectives) => set({ objectives }),
    }),
    {
      name: 'iterum_objectives_storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.objectives = state.objectives.map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt),
            deadline: o.deadline ? new Date(o.deadline) : undefined,
          }));
        }
      },
    },
  ),
);
