import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalStorageAdapter } from './iterumStorage';
import { Habit, JournalEntry, Objective, Task } from '../../types';

describe('createLocalStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists task collections using the Zustand envelope shape', () => {
    const adapter = createLocalStorageAdapter();
    const task: Task = {
      id: 'task-1',
      type: 'task',
      title: 'Plan day',
      date: new Date('2026-04-22T08:00:00.000Z'),
      completed: false,
      createdAt: new Date('2026-04-22T07:00:00.000Z'),
    };

    adapter.writeTasks([task]);

    expect(adapter.readTasks()).toEqual([task]);
  });

  it('keeps habits and habit logs in the same persisted namespace', () => {
    const adapter = createLocalStorageAdapter();
    const habit: Habit = {
      id: 'habit-1',
      name: 'Read',
      frequency: 'daily',
      type: 'yesno',
      isActive: true,
      createdAt: new Date('2026-04-22T07:00:00.000Z'),
    };
    const log = {
      id: 'log-1',
      habitId: habit.id,
      date: '2026-04-22',
      completed: true,
      createdAt: new Date('2026-04-22T08:00:00.000Z'),
    };

    adapter.writeHabits([habit]);
    adapter.writeHabitLogs([log]);

    expect(adapter.readHabits()).toEqual([habit]);
    expect(adapter.readHabitLogs()).toEqual([log]);
  });

  it('persists objectives and journals without remote identity fields', () => {
    const adapter = createLocalStorageAdapter();
    const objective: Objective = {
      id: 'objective-1',
      title: 'Run 10k',
      targetValue: 10,
      currentValue: 0,
      unit: 'km',
      color: '#C9935A',
      status: 'active',
      progress: 0,
      createdAt: new Date('2026-04-22T07:00:00.000Z'),
    };
    const journal: JournalEntry = {
      id: 'journal-1',
      payload: '{"text":"Good day"}',
      created_at: '2026-04-22T20:00:00.000Z',
      text: 'Good day',
    };

    adapter.writeObjectives([objective]);
    adapter.writeJournals([journal]);

    expect(adapter.readObjectives()).toEqual([objective]);
    expect(adapter.readJournals()).toEqual([journal]);
  });
});
