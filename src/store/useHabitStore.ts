import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { Habit, HabitLog } from '../types';
import { iterumStateStorage } from '../core/storage/iterumStorage';

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

function reviveHabit(habit: Habit): Habit {
  return {
    ...habit,
    createdAt: new Date(habit.createdAt),
    archivedAt: habit.archivedAt ? new Date(habit.archivedAt) : undefined,
  };
}

function reviveLog(log: HabitLog): HabitLog {
  return {
    ...log,
    createdAt: new Date(log.createdAt),
  };
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
      updateHabit: (id, updates) =>
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === id ? { ...habit, ...updates } : habit)),
        })),
      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
          logs: state.logs.filter((log) => log.habitId !== id),
        })),
      toggleHabitLog: (habitId, date, value, note) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        set((state) => {
          const existingLog = state.logs.find((log) => log.habitId === habitId && log.date === dateStr);

          if (!existingLog) {
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

          if (existingLog.completed && value === undefined && !note) {
            return { logs: state.logs.filter((log) => log.id !== existingLog.id) };
          }

          const updatedLog: HabitLog = {
            ...existingLog,
            completed: true,
            value: value ?? existingLog.value,
            note: note ?? existingLog.note,
          };

          return {
            logs: state.logs.map((log) => (log.id === existingLog.id ? updatedLog : log)),
          };
        });
      },
      setHabits: (habits) => set({ habits }),
      setLogs: (logs) => set({ logs }),
    }),
    {
      name: 'iterum_habits_storage',
      storage: createJSONStorage(() => iterumStateStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.habits = state.habits.map(reviveHabit);
        state.logs = state.logs.map(reviveLog);
      },
    },
  ),
);
