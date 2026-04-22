import { describe, it, expect } from 'vitest';
import { shouldHabitOccurOnDate, calculateCurrentStreak, calculateObjectiveProgress } from './habitUtils';
import { Habit, HabitLog } from '../types';
import { subDays, format } from 'date-fns';

describe('habitUtils', () => {
  describe('shouldHabitOccurOnDate', () => {
    it('should return true for daily frequency', () => {
      const date = new Date();
      expect(shouldHabitOccurOnDate('daily', date)).toBe(true);
    });

    it('should return true for specific weekly days', () => {
      // 2024-03-20 is a Wednesday (miércoles)
      const wednesday = new Date('2024-03-20T12:00:00Z');
      expect(shouldHabitOccurOnDate('weekly:wed', wednesday)).toBe(true);
      expect(shouldHabitOccurOnDate('weekly:mon,wed,fri', wednesday)).toBe(true);
      expect(shouldHabitOccurOnDate('weekly:mon,fri', wednesday)).toBe(false);
    });

    it('should return true for every X days', () => {
      const date = new Date('2024-03-20T12:00:00Z');
      // This depends on epoch days, so we check if it's consistent
      const x = 2;
      const occurs = shouldHabitOccurOnDate(`everyXdays:${x}`, date);
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      expect(shouldHabitOccurOnDate(`everyXdays:${x}`, nextDay)).toBe(!occurs);
    });
  });

  describe('calculateCurrentStreak', () => {
    const habit: Habit = {
      id: '1',
      name: 'Test Habit',
      frequency: 'daily',
      color: '#000',
      type: 'yesno',
      createdAt: new Date(),
      isActive: true,
    };

    it('should return 0 if no logs', () => {
      expect(calculateCurrentStreak([], habit)).toBe(0);
    });

    it('should calculate a simple daily streak', () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const dayBefore = format(subDays(new Date(), 2), 'yyyy-MM-dd');

      const logs: HabitLog[] = [
        { id: '1', habitId: '1', date: today, completed: true, createdAt: new Date() },
        { id: '2', habitId: '1', date: yesterday, completed: true, createdAt: new Date() },
        { id: '3', habitId: '1', date: dayBefore, completed: true, createdAt: new Date() },
      ];

      expect(calculateCurrentStreak(logs, habit)).toBe(3);
    });

    it('should break streak if a day is missed', () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const dayBefore = format(subDays(new Date(), 2), 'yyyy-MM-dd');

      const logs: HabitLog[] = [
        { id: '1', habitId: '1', date: today, completed: true, createdAt: new Date() },
        { id: '3', habitId: '1', date: dayBefore, completed: true, createdAt: new Date() },
      ];

      expect(calculateCurrentStreak(logs, habit)).toBe(1);
    });
  });

  describe('calculateObjectiveProgress', () => {
    it('sums numeric habit logs linked to an objective', () => {
      const objective = {
        id: 'objective-1',
        title: 'Run 10k',
        targetValue: 10,
        currentValue: 0,
        unit: 'km',
        color: '#C9935A',
        status: 'active' as const,
        progress: 0,
        createdAt: new Date(),
      };
      const habits: Habit[] = [
        {
          id: 'habit-1',
          name: 'Run',
          frequency: 'daily',
          type: 'numeric',
          unit: 'km',
          objectiveIds: ['objective-1'],
          createdAt: new Date(),
          isActive: true,
        },
      ];
      const logs: HabitLog[] = [
        { id: 'log-1', habitId: 'habit-1', date: '2026-04-21', completed: true, value: 3, createdAt: new Date() },
        { id: 'log-2', habitId: 'habit-1', date: '2026-04-22', completed: true, value: 4, createdAt: new Date() },
      ];

      expect(calculateObjectiveProgress(objective, habits, logs)).toBe(7);
    });

    it('counts yes/no check-ins linked from the objective side', () => {
      const objective = {
        id: 'objective-1',
        title: 'Write consistently',
        targetValue: 30,
        currentValue: 0,
        unit: 'sessions',
        color: '#C9935A',
        status: 'active' as const,
        progress: 0,
        linkedHabitId: 'habit-1',
        createdAt: new Date(),
      };
      const habits: Habit[] = [
        {
          id: 'habit-1',
          name: 'Write',
          frequency: 'daily',
          type: 'yesno',
          createdAt: new Date(),
          isActive: true,
        },
      ];
      const logs: HabitLog[] = [
        { id: 'log-1', habitId: 'habit-1', date: '2026-04-21', completed: true, createdAt: new Date() },
        { id: 'log-2', habitId: 'habit-1', date: '2026-04-22', completed: false, createdAt: new Date() },
        { id: 'log-3', habitId: 'habit-1', date: '2026-04-23', completed: true, createdAt: new Date() },
      ];

      expect(calculateObjectiveProgress(objective, habits, logs)).toBe(2);
    });
  });
});
