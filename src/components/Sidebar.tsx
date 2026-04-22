import React from 'react';
import { Target, ChevronRight, BookOpen, Archive as ArchiveIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  AppStats,
  Objective,
  ViewMode,
  Habit,
  HabitLog,
  Task,
  DayClosure,
  WeeklyInsight,
} from '../types';
import { cn } from '../utils';

interface SidebarProps {
  stats: AppStats;
  objectivesWithProgress: Objective[];
  objectives: Objective[];
  setViewMode: (mode: ViewMode) => void;
  isFocusMode: boolean;
  setIsFocusMode: (isFocus: boolean) => void;
  habits: Habit[];
  logs: HabitLog[];
  tasks: Task[];
  closedDays: DayClosure[];
  weeklyInsights: WeeklyInsight[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  stats,
  objectivesWithProgress,
  objectives,
  setViewMode,
  isFocusMode,
  setIsFocusMode,
  habits,
  logs,
  tasks,
  closedDays,
  weeklyInsights,
}) => {
  return (
    <aside className="space-y-8 lg:col-span-4">
      <section className="iterum-card bg-accent/5 border-accent/20">
        <div className="mb-4 flex items-center gap-4">
          <div className="bg-accent text-bg-primary shadow-accent/20 flex h-12 w-12 items-center justify-center rounded-[16px] text-xl font-bold shadow-lg">
            {stats.level}
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-end justify-between">
              <span className="text-accent text-[10px] font-bold tracking-widest uppercase">
                Nivel {stats.level}
              </span>
              <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
                {stats.totalExp % 100} / 100 EXP
              </span>
            </div>
            <div className="bg-bg-primary h-2 overflow-hidden rounded-full dark:bg-[--dark-bg-primary]">
              <div
                className="bg-accent h-full transition-all duration-500"
                style={{ width: `${stats.totalExp % 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-bg-primary/50 rounded-[12px] p-2 text-center dark:bg-black/20">
            <p className="text-text-muted text-[8px] font-bold tracking-tighter uppercase">
              Disciplina
            </p>
            <p className="text-accent text-xs font-bold">Lvl {stats.discipline.level}</p>
          </div>
          <div className="bg-bg-primary/50 rounded-[12px] p-2 text-center dark:bg-black/20">
            <p className="text-text-muted text-[8px] font-bold tracking-tighter uppercase">
              Consistencia
            </p>
            <p className="text-accent text-xs font-bold">Lvl {stats.consistency.level}</p>
          </div>
        </div>
      </section>

      <section className="iterum-card">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold">
            <Target className="text-accent-secondary h-5 w-5" />
            Objetivos
          </h3>
          <button
            onClick={() => setViewMode('objectives')}
            className="text-text-muted hover:text-accent p-1 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          {objectivesWithProgress.slice(0, 3).map((obj) => {
            const progress = Math.min(100, Math.round((obj.currentValue / obj.targetValue) * 100));
            return (
              <div key={obj.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="max-w-[150px] truncate font-medium">{obj.title}</span>
                  <span className="text-accent">{progress}%</span>
                </div>
                <div className="bg-bg-primary h-2 overflow-hidden rounded-full dark:bg-[--dark-bg-primary]">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: obj.color }}
                  />
                </div>
              </div>
            );
          })}
          {objectives.length === 0 && (
            <p className="text-text-muted py-4 text-center text-xs italic">Sin objetivos activos</p>
          )}
        </div>
      </section>

      <section className="iterum-card">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold">
            <BookOpen className="text-accent h-5 w-5" />
            Journal
          </h3>
          <div className="flex items-center gap-2">
            {stats.level >= 5 && (
              <button
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={cn(
                  'rounded-full px-2 py-1 text-[8px] font-bold tracking-widest uppercase transition-all',
                  isFocusMode
                    ? 'bg-accent text-bg-primary'
                    : 'bg-bg-secondary text-text-muted hover:text-accent',
                )}
              >
                {isFocusMode ? 'Salir Foco' : 'Modo Foco'}
              </button>
            )}
            <button className="text-accent text-xs font-semibold">NUEVO</button>
          </div>
        </div>
        <p className="text-text-muted text-sm italic dark:text-[--dark-text-muted]">
          &quot;El foco no es lo que haces, sino lo que dejas de hacer...&quot;
        </p>
      </section>

      <section className="iterum-card border-dashed">
        <h3 className="text-text-muted mb-4 text-[10px] font-bold tracking-widest uppercase">
          Datos Locales
        </h3>
        <div className="bg-bg-secondary/70 border-border-subtle mb-4 rounded-[16px] border p-3 dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]/70">
          <p className="text-text-muted text-xs leading-relaxed">
            Todo se guarda en este navegador. ITERUM está funcionando en modo offline, sin cuenta y sin sincronización externa.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => {
              const data = { habits, logs, objectives, tasks, closedDays, weeklyInsights, stats };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `iterum-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
              a.click();
            }}
            className="border-border-subtle text-text-muted hover:text-accent hover:border-accent/30 flex items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-[10px] font-bold transition-all dark:border-[--dark-border-subtle]"
          >
            <ArchiveIcon className="h-3 w-3" />
            Exportar
          </button>
        </div>
      </section>
    </aside>
  );
};
