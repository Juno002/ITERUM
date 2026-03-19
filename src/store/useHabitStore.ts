import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Habit, HabitLog } from '../types';
import { format } from 'date-fns';

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (habitData: Omit<Habit, 'id' | 'isActive' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitLog: (habitId: string, date: Date, value?: number, note?: string) => void;
  setHabits: (habits: Habit[]) => void;
  setLogs: (logs: HabitLog[]) => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      habits: [],
      logs: [],
      addHabit: (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: crypto.randomUUID(),
          isActive: true,
          createdAt: new Date(),
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },
      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }));
      },
      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          logs: state.logs.filter((l) => l.habitId !== id),
        }));
      },
      toggleHabitLog: (habitId, date, value, note) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        set((state) => {
          const existingLog = state.logs.find((l) => l.habitId === habitId && l.date === dateStr);
          if (existingLog) {
            if (existingLog.completed && !value && !note) {
              return { logs: state.logs.filter((l) => l.id !== existingLog.id) };
            } else {
              return {
                logs: state.logs.map((l) =>
                  l.id === existingLog.id
                    ? { ...l, completed: true, value: value ?? l.value, note: note ?? l.note }
                    : l
                ),
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
    }
  )
);
