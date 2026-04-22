import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Objective } from '../types';
import { iterumStateStorage } from '../core/storage/iterumStorage';

interface ObjectiveState {
  objectives: Objective[];
  isLoading: boolean;
  error: string | null;
  setObjectives: (objectives: Objective[]) => void;
  addObjective: (objective: Omit<Objective, 'id' | 'createdAt'>) => Promise<void>;
  updateObjective: (id: string, updates: Partial<Objective>) => Promise<void>;
  deleteObjective: (id: string) => Promise<void>;
}

function reviveObjective(objective: Objective): Objective {
  return {
    ...objective,
    createdAt: new Date(objective.createdAt),
    deadline: objective.deadline ? new Date(objective.deadline) : undefined,
    milestones: objective.milestones?.map((milestone) => ({
      ...milestone,
      completedAt: milestone.completedAt ? new Date(milestone.completedAt) : undefined,
    })),
  };
}

export const useObjectiveStore = create<ObjectiveState>()(
  persist(
    (set) => ({
      objectives: [],
      isLoading: false,
      error: null,
      setObjectives: (objectives) => set({ objectives }),
      addObjective: async (objectiveData) => {
        const newObjective: Objective = {
          ...objectiveData,
          id: crypto.randomUUID(),
          targetValue: objectiveData.targetValue ?? 100,
          currentValue: objectiveData.currentValue ?? 0,
          unit: objectiveData.unit ?? '%',
          color: objectiveData.color ?? '#c9935a',
          progress: objectiveData.progress ?? 0,
          status: objectiveData.status ?? 'active',
          createdAt: new Date(),
        };

        set((state) => ({
          objectives: [newObjective, ...state.objectives],
        }));
      },
      updateObjective: async (id, updates) => {
        set((state) => ({
          objectives: state.objectives.map((objective) =>
            objective.id === id ? { ...objective, ...updates } : objective,
          ),
        }));
      },
      deleteObjective: async (id) => {
        set((state) => ({
          objectives: state.objectives.filter((objective) => objective.id !== id),
        }));
      },
    }),
    {
      name: 'iterum_objectives_v1',
      storage: createJSONStorage(() => iterumStateStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.objectives = state.objectives.map(reviveObjective);
      },
    },
  ),
);
