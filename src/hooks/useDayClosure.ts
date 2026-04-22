import { useAppStatsStore } from '../store/useAppStatsStore';
import { DayClosure, Task, Habit, HabitLog, WeeklyInsight } from '../types';
import { format, addDays } from 'date-fns';

export function useDayClosure() {
  const {
    closedDays,
    setClosedDays,
    weeklyInsights,
    setWeeklyInsights,
    addWeeklyInsight: addWeeklyInsightToStore,
  } = useAppStatsStore();

  const isDayClosed = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return closedDays.some((d) => d.date === dateStr);
  };

  const calculateStreak = () => {
    let streak = 0;
    let current = new Date();

    // Check if today is closed or yesterday was closed to continue streak
    if (!isDayClosed(current)) {
      current = addDays(current, -1);
    }

    while (isDayClosed(current)) {
      streak++;
      current = addDays(current, -1);
    }
    return streak;
  };

  const closeDay = async (
    date: Date,
    habits: Habit[],
    logs: HabitLog[],
    tasks: Task[],
    updateTask: (id: string, updates: Partial<Task>) => void,
    _addTask: (task: Omit<Task, 'id' | 'completed'>) => void,
  ) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (isDayClosed(date)) return null;

    const summary = 'Día cerrado con éxito.';

    // Move open tasks forward so the next day starts with a clean, local queue.
    const todayTasks = tasks.filter(
      (t) => format(t.date, 'yyyy-MM-dd') === dateStr && !t.completed,
    );
    todayTasks.forEach((t) => {
      updateTask(t.id, {
        date: addDays(t.date, 1),
      });
    });

    // 2. Handle uncompleted habits
    // (Optional logic for habits can be added here in the future)

    // 3. Mark day as closed
    const newClosure: DayClosure = {
      date: dateStr,
      summary,
      closedAt: new Date(),
    };

    setClosedDays([...closedDays, newClosure]);
    return newClosure;
  };

  const addWeeklyInsight = (insight: WeeklyInsight) => {
    const newInsight = { ...insight, generatedAt: new Date() };
    addWeeklyInsightToStore(newInsight);
  };

  return {
    closedDays,
    isDayClosed,
    closeDay,
    calculateStreak,
    setClosedDays,
    weeklyInsights,
    addWeeklyInsight,
    setWeeklyInsights,
  };
}
