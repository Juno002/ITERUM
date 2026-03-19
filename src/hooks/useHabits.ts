import { useHabitStore } from '../store/useHabitStore';

export function useHabits() {
  const { habits, logs, addHabit, updateHabit, deleteHabit, toggleHabitLog, setHabits, setLogs } = useHabitStore();
  return { habits, logs, addHabit, updateHabit, deleteHabit, toggleHabitLog, setHabits, setLogs };
}
