import { format, isSameDay, parseISO, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Habit, HabitLog, Objective } from '../types';

export function shouldHabitOccurOnDate(frequency: string, date: Date): boolean {
  const dayName = format(date, 'EEE', { locale: es }).toLowerCase(); // lun, mar, mié, jue, vie, sáb, dom
  
  if (frequency === 'daily') return true;
  
  if (frequency.startsWith('weekly:')) {
    const days = frequency.split(':')[1].toLowerCase().split(',');
    const dayMap: Record<string, string> = {
      'mon': 'lun', 'tue': 'mar', 'wed': 'mié', 'thu': 'jue', 'fri': 'vie', 'sat': 'sáb', 'sun': 'dom',
      'monday': 'lun', 'tuesday': 'mar', 'wednesday': 'mié', 'thursday': 'jue', 'friday': 'vie', 'saturday': 'sáb', 'sunday': 'dom'
    };
    
    const normalizedDays = days.map(d => dayMap[d] || d);
    return normalizedDays.includes(dayName);
  }
  
  if (frequency.startsWith('everyXdays:')) {
    const x = parseInt(frequency.split(':')[1], 10);
    const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    return daysSinceEpoch % x === 0;
  }
  
  return false;
}

export function calculateCurrentStreak(logs: HabitLog[], habit: Habit): number {
  if (!logs.length) return 0;
  
  const sortedLogs = [...logs]
    .filter(l => l.habitId === habit.id && l.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  if (!sortedLogs.length) return 0;

  let streak = 0;
  let checkDate = startOfDay(new Date());
  
  const todayCompleted = sortedLogs.find(l => isSameDay(parseISO(l.date), checkDate));
  
  if (!todayCompleted) {
    if (shouldHabitOccurOnDate(habit.frequency, checkDate)) {
      checkDate = subDays(checkDate, 1);
    } else {
      while (!shouldHabitOccurOnDate(habit.frequency, checkDate)) {
        checkDate = subDays(checkDate, 1);
      }
    }
  }

  while (true) {
    if (shouldHabitOccurOnDate(habit.frequency, checkDate)) {
      const log = sortedLogs.find(l => isSameDay(parseISO(l.date), checkDate));
      if (log && log.completed) {
        streak++;
      } else {
        break;
      }
    }
    checkDate = subDays(checkDate, 1);
    if (streak > 1000) break;
  }

  return streak;
}

export function calculateObjectiveProgress(objective: Objective, habits: Habit[], logs: HabitLog[]): number {
  // Find habits linked via habit.objectiveIds OR objective.linkedHabitId
  const linkedHabits = habits.filter(h => 
    h.objectiveIds?.includes(objective.id) || 
    h.id === objective.linkedHabitId
  );
  
  let totalProgress = 0;

  linkedHabits.forEach(habit => {
    const habitLogs = logs.filter(l => l.habitId === habit.id && l.completed);
    
    if (habit.type === 'numeric') {
      // Sum values for numeric habits
      totalProgress += habitLogs.reduce((sum, log) => sum + (log.value || 0), 0);
    } else {
      // Count completions for yes/no habits
      totalProgress += habitLogs.length;
    }
  });

  return totalProgress;
}
