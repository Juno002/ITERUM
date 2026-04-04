import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format } from 'date-fns';
import { Habit, HabitLog } from '../types';
import { dbService } from '../services/dbService';
import { useUserStore } from './useUserStore';

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  loadHabits: (userId: string) => Promise<void>;
  loadLogs: (userId: string) => Promise<void>;
  addHabit: (habitData: Omit<Habit, 'id' | 'isActive' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitLog: (habitId: string, date: Date, value?: number, note?: string) => void;
  setHabits: (habits: Habit[]) => void;
  setLogs: (logs: HabitLog[]) => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],

      loadHabits: async (userId) => {
        try {
          const habits = await dbService.getHabits(userId);
          set({ habits: habits.map((h: any) => ({ ...h, createdAt: new Date(h.created_at) })) });
        } catch (error) {
          console.error('Failed to load habits:', error);
        }
      },

      loadLogs: async (userId) => {
        try {
          const logs = await dbService.getHabitLogs(userId);
          set({ logs: logs.map((l: any) => ({ ...l, createdAt: new Date(l.created_at) })) });
        } catch (error) {
          console.error('Failed to load logs:', error);
        }
      },

      addHabit: (habitData) => {
        const userId = useUserStore.getState().userId;
        const newHabit: Habit = {
          ...habitData,
          id: crypto.randomUUID(),
          isActive: true,
          createdAt: new Date(),
        };

        set((state) => ({ habits: [...state.habits, newHabit] }));

        if (userId) {
          dbService.createHabit(userId, habitData).catch(console.error);
        }
      },

      updateHabit: (id, updates) => {
        const userId = useUserStore.getState().userId;
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }));

        if (userId) {
          dbService.updateHabit(userId, id, updates).catch(console.error);
        }
      },

      deleteHabit: (id) => {
        const userId = useUserStore.getState().userId;
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          logs: state.logs.filter((l) => l.habitId !== id),
        }));

        if (userId) {
          dbService.deleteHabit(userId, id).catch(console.error);
        }
      },

      toggleHabitLog: (habitId, date, value, note) => {
        const userId = useUserStore.getState().userId;
        const dateStr = format(date, 'yyyy-MM-dd');

        set((state) => {
          const existingLog = state.logs.find((l) => l.habitId === habitId && l.date === dateStr);
          if (existingLog) {
            if (existingLog.completed && !value && !note) {
              if (userId) dbService.deleteHabitLog(userId, existingLog.id).catch(console.error);
              return { logs: state.logs.filter((l) => l.id !== existingLog.id) };
            } else {
              const updatedLog = {
                ...existingLog,
                completed: true,
                value: value ?? existingLog.value,
                note: note ?? existingLog.note,
              };
              if (userId) dbService.upsertHabitLog(userId, updatedLog).catch(console.error);
              return {
                logs: state.logs.map((l) => (l.id === existingLog.id ? updatedLog : l)),
              };
            }
          } else {
            const newLog: HabitLog = {
              id: crypto.randomUUID(),
              habitId,
              date: dateStr,
              completed: true,
              value,
              note,
              createdAt: new Date(),
            };
            if (userId) dbService.upsertHabitLog(userId, newLog).catch(console.error);
            return { logs: [...state.logs, newLog] };
          }
        });
      },
      setHabits: (habits) => set({ habits }),
      setLogs: (logs) => set({ logs }),
    }),
    {
      name: 'iterum_habits_storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.habits = state.habits.map((h: any) => ({
            ...h,
            createdAt: new Date(h.createdAt),
            archivedAt: h.archivedAt ? new Date(h.archivedAt) : undefined,
          }));
          state.logs = state.logs.map((l: any) => ({
            ...l,
            createdAt: new Date(l.createdAt),
          }));
        }
      },
    },
  ),
);
