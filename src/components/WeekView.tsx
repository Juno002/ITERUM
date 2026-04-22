import React, { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Habit, HabitLog } from '../types';
import { cn } from '../utils';
import { Lock, Zap } from 'lucide-react';

interface WeekViewProps {
  habits: Habit[];
  logs: HabitLog[];
  appLevel: number;
}

export function WeekView({ habits, logs, appLevel }: WeekViewProps) {
  const isLocked = appLevel < 3;

  const days = useMemo(() => {
    const today = startOfToday();
    return eachDayOfInterval({
      start: subDays(today, 20), // Show last 21 days
      end: today,
    });
  }, []);

  if (isLocked) {
    return (
      <div className="iterum-card bg-accent/5 border-accent/20 flex flex-col items-center justify-center border-dashed px-6 py-20">
        <div className="bg-bg-primary mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] shadow-sm dark:bg-[--dark-bg-primary]">
          <Lock className="text-accent h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-bold">Vista de Mapa de Calor Bloqueada</h3>
        <p className="text-text-muted mb-8 max-w-xs text-center dark:text-[--dark-text-muted]">
          Alcanza el <span className="text-accent font-bold">Nivel 3</span> para desbloquear la
          visualización de consistencia a largo plazo.
        </p>
        <div className="bg-accent/10 flex items-center gap-2 rounded-full px-4 py-2">
          <Zap className="text-accent h-4 w-4" />
          <span className="text-accent text-xs font-bold tracking-widest uppercase">
            Nivel {appLevel} / 3
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h3 className="text-accent flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase">
          <span className="bg-accent h-1.5 w-1.5 rounded-full"></span>
          Mapa de Consistencia
        </h3>
        <div className="text-text-muted flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-1.5">
            <div className="bg-bg-secondary border-border-subtle h-3 w-3 rounded-sm border dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]"></div>
            <span>Nada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-accent/40 h-3 w-3 rounded-sm"></div>
            <span>Algo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-accent h-3 w-3 rounded-sm"></div>
            <span>Total</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-max space-y-6">
          {habits
            .filter((h) => h.isActive)
            .map((habit) => {
              return (
                <div key={habit.id} className="flex items-center gap-6">
                  <div className="w-32 flex-shrink-0">
                    <p className="truncate text-sm font-bold" style={{ color: habit.color }}>
                      {habit.name}
                    </p>
                    <p className="text-text-muted text-[10px] tracking-wider uppercase">
                      {habit.category || 'Hábito'}
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    {days.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const log = logs.find((l) => l.habitId === habit.id && l.date === dateStr);
                      const isCompleted = log?.completed;

                      return (
                        <div
                          key={dateStr}
                          className={cn(
                            'group relative h-8 w-8 rounded-[8px] border transition-all duration-300',
                            isCompleted
                              ? 'bg-accent border-accent shadow-sm'
                              : 'bg-bg-secondary border-border-subtle hover:border-accent/30 dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]',
                          )}
                          style={
                            isCompleted
                              ? { backgroundColor: habit.color, borderColor: habit.color }
                              : {}
                          }
                        >
                          {/* Tooltip */}
                          <div className="bg-text-primary text-bg-primary pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded px-2 py-1 text-[10px] font-bold whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
                            {format(day, "d 'de' MMMM", { locale: es })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {habits.filter((h) => h.isActive).length === 0 && (
            <div className="iterum-card border-dashed py-10 text-center">
              <p className="text-text-muted">No hay hábitos activos para mostrar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
