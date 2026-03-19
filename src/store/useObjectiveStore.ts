import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Objective } from '../types';

interface ObjectiveState {
  objectives: Objective[];
  addObjective: (objectiveData: Omit<Objective, 'id' | 'isActive' | 'createdAt'>) => void;
  updateObjective: (id: string, updates: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;
  setObjectives: (objectives: Objective[]) => void;
}

export const useObjectiveStore = create<ObjectiveState>()(
  persist(
    (set) => ({
      objectives: [],
      addObjective: (objectiveData) => {
        const newObjective: Objective = {
          ...objectiveData,
          id: crypto.randomUUID(),
          isActive: true,
          createdAt: new Date(),
        };
        set((state) => ({ objectives: [...state.objectives, newObjective] }));
      },
      updateObjective: (id, updates) => {
        set((state) => ({
          objectives: state.objectives.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));
      },
      deleteObjective: (id) => {
        set((state) => ({
          objectives: state.objectives.filter((o) => o.id !== id),
        }));
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
    }
  )
);
