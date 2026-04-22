import { beforeEach, describe, expect, it } from 'vitest';
import { useHabitStore } from './useHabitStore';
import { useJournalStore } from './useJournalStore';
import { useObjectiveStore } from './useObjectiveStore';
import { useTaskStore } from './useTaskStore';
import {
  createLocalStorageAdapter,
  setIterumStorageAdapter,
  type IterumStorageAdapter,
} from '../core/storage/iterumStorage';

describe('offline local stores', () => {
  beforeEach(() => {
    localStorage.clear();
    setIterumStorageAdapter(createLocalStorageAdapter());
    useTaskStore.setState({ tasks: [] });
    useHabitStore.setState({ habits: [], logs: [] });
    useObjectiveStore.setState({ objectives: [], isLoading: false, error: null });
    useJournalStore.setState({ journals: [], isLoading: false, error: null });
  });

  it('creates, toggles, updates and deletes tasks locally', () => {
    useTaskStore.getState().addTask({
      type: 'task',
      title: 'Write plan',
      date: new Date('2026-04-22T10:00:00.000Z'),
    });

    const created = useTaskStore.getState().tasks[0];
    expect(created.title).toBe('Write plan');
    expect(created.completed).toBe(false);

    useTaskStore.getState().toggleTask(created.id);
    expect(useTaskStore.getState().tasks[0].completed).toBe(true);

    useTaskStore.getState().updateTask(created.id, { title: 'Write better plan' });
    expect(useTaskStore.getState().tasks[0].title).toBe('Write better plan');

    useTaskStore.getState().deleteTask(created.id);
    expect(useTaskStore.getState().tasks).toHaveLength(0);
  });

  it('creates habits and toggles local habit logs without identity input', () => {
    useHabitStore.getState().addHabit({
      name: 'Meditate',
      frequency: 'daily',
      type: 'yesno',
    });

    const habit = useHabitStore.getState().habits[0];
    useHabitStore.getState().toggleHabitLog(habit.id, new Date('2026-04-22T12:00:00.000Z'));

    expect(useHabitStore.getState().logs).toMatchObject([
      {
        habitId: habit.id,
        date: '2026-04-22',
        completed: true,
      },
    ]);

    useHabitStore.getState().toggleHabitLog(habit.id, new Date('2026-04-22T12:00:00.000Z'));
    expect(useHabitStore.getState().logs).toHaveLength(0);
  });

  it('stores objectives and journal entries locally', async () => {
    await useObjectiveStore.getState().addObjective({
      title: 'Read 12 books',
      targetValue: 12,
      currentValue: 0,
      unit: 'books',
      color: '#C9935A',
      status: 'active',
      progress: 0,
    });
    await useJournalStore.getState().addJournal('First local reflection');

    expect(useObjectiveStore.getState().objectives[0]).toMatchObject({
      title: 'Read 12 books',
      targetValue: 12,
    });
    expect(useJournalStore.getState().journals[0]).toMatchObject({
      text: 'First local reflection',
    });
  });

  it('writes store updates through the active storage adapter', () => {
    const storage = new Map<string, string>();
    const adapter: IterumStorageAdapter = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      },
      readTasks: () => [],
      writeTasks: () => {},
      readHabits: () => [],
      writeHabits: () => {},
      readHabitLogs: () => [],
      writeHabitLogs: () => {},
      readObjectives: () => [],
      writeObjectives: () => {},
      readJournals: () => [],
      writeJournals: () => {},
      readStats: () => ({ stats: createAppStatsFixture(), closedDays: [], weeklyInsights: [] }),
      writeStats: () => {},
    };

    setIterumStorageAdapter(adapter);

    useTaskStore.getState().addTask({
      type: 'task',
      title: 'Injected adapter write',
      date: new Date('2026-04-22T10:00:00.000Z'),
    });

    expect(storage.get('planner_tasks')).toContain('Injected adapter write');
  });
});

function createAppStatsFixture() {
  return {
    discipline: { exp: 0, level: 1 },
    consistency: { exp: 0, level: 1 },
    totalExp: 0,
    level: 1,
    onboardingCompleted: false,
  };
}
