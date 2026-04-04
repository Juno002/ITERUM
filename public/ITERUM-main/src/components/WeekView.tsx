import React, { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, isSameDay, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Habit, HabitLog } from '../types';
import { cn } from '../utils';
import { Lock, Zap } from 'lucide-react';

interface WeekViewProps {
  habits: Habit[];
  logs: HabitLog[];
  userLevel: number;
}

export function WeekView({ habits, logs, userLevel }: WeekViewProps) {
  const isLocked = userLevel < 3;

  const days = useMemo(() => {
    const today = startOfToday();
    return eachDayOfInterval({
      start: subDays(today, 20), // Show last 21 days
      end: today
    });
  }, []);

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 iterum-card border-dashed bg-accent/5 border-accent/20">
        <div className="w-16 h-16 bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] flex items-center justify-center mb-6 shadow-sm">
          <Lock className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-bold mb-2">Vista de Mapa de Calor Bloqueada</h3>
        <p className="text-text-muted dark:text-[--dark-text-muted] text-center max-w-xs mb-8">
          Alcanza el <span className="text-accent font-bold">Nivel 3</span> para desbloquear la visualización de consistencia a largo plazo.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-accent uppercase tracking-widest">Nivel {userLevel} / 3</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
          Mapa de Consistencia
        </h3>
        <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-bg-secondary dark:bg-[--dark-bg-secondary] border border-border-subtle dark:border-[--dark-border-subtle]"></div>
            <span>Nada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-accent/40"></div>
            <span>Algo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-accent"></div>
            <span>Total</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-max space-y-6">
          {habits.filter(h => h.isActive).map(habit => {
            return (
              <div key={habit.id} className="flex items-center gap-6">
                <div className="w-32 flex-shrink-0">
                  <p className="text-sm font-bold truncate" style={{ color: habit.color }}>{habit.name}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{habit.category || 'Hábito'}</p>
                </div>
                
                <div className="flex gap-1.5">
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
                    const isCompleted = log?.completed;
                    
                    return (
                      <div 
                        key={dateStr}
                        className={cn(
                          "w-8 h-8 rounded-[8px] border transition-all duration-300 group relative",
                          isCompleted 
                            ? "bg-accent border-accent shadow-sm" 
                            : "bg-bg-secondary dark:bg-[--dark-bg-secondary] border-border-subtle dark:border-[--dark-border-subtle] hover:border-accent/30"
                        )}
                        style={isCompleted ? { backgroundColor: habit.color, borderColor: habit.color } : {}}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-text-primary text-bg-primary text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                          {format(day, "d 'de' MMMM", { locale: es })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {habits.filter(h => h.isActive).length === 0 && (
            <div className="py-10 text-center iterum-card border-dashed">
              <p className="text-text-muted">No hay hábitos activos para mostrar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
