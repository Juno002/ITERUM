import { useState, useEffect } from 'react';
import { Habit, HabitLog } from '../types';
import { format } from 'date-fns';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('iterum_habits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((h: any) => ({
          ...h,
          createdAt: new Date(h.createdAt),
          archivedAt: h.archivedAt ? new Date(h.archivedAt) : undefined,
        }));
      } catch (e) {
        console.error('Failed to parse habits', e);
        return [];
      }
    }
    return [];
  });

  const [logs, setLogs] = useState<HabitLog[]>(() => {
    const saved = localStorage.getItem('iterum_habit_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((l: any) => ({
          ...l,
          createdAt: new Date(l.createdAt),
        }));
      } catch (e) {
        console.error('Failed to parse habit logs', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('iterum_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('iterum_habit_logs', JSON.stringify(logs));
  }, [logs]);

  const addHabit = (habitData: Omit<Habit, 'id' | 'isActive' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: crypto.randomUUID(),
      isActive: true,
      createdAt: new Date(),
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habitId !== id));
  };

  const toggleHabitLog = (habitId: string, date: Date, value?: number, note?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingLog = logs.find((l) => l.habitId === habitId && l.date === dateStr);

    if (existingLog) {
      if (existingLog.completed && !value && !note) {
        // Uncheck
        setLogs((prev) => prev.filter((l) => l.id !== existingLog.id));
      } else {
        // Update
        setLogs((prev) =>
          prev.map((l) =>
            l.id === existingLog.id
              ? { ...l, completed: true, value: value ?? l.value, note: note ?? l.note }
              : l
          )
        );
      }
    } else {
      // Create new log
      const newLog: HabitLog = {
        id: crypto.randomUUID(),
        habitId,
        date: dateStr,
        completed: true,
        value,
        note,
        createdAt: new Date(),
      };
      setLogs((prev) => [...prev, newLog]);
    }
  };

  return { habits, logs, addHabit, updateHabit, deleteHabit, toggleHabitLog, setHabits, setLogs };
}
