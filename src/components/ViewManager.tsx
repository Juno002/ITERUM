import React from 'react';
import { ViewMode, Habit, HabitLog, Objective, Task, WeeklyInsight, AppStats } from '../types';
import { HabitCard } from './HabitCard';
import { ObjectiveCard } from './ObjectiveCard';
import { JournalView } from './JournalView';
import { ListView } from './ListView';
import { WeekView } from './WeekView';
import { CalendarView } from './CalendarView';
interface ViewManagerProps {
  viewMode: ViewMode;
  filteredHabits: Habit[];
  filteredObjectives: Objective[];
  filteredTasks: Task[];
  todayHabits: Habit[];
  habits: Habit[];
  logs: HabitLog[];
  weeklyInsights: WeeklyInsight[];
  stats: AppStats;
  toggleHabitLog: (id: string, date: Date, value?: number, note?: string) => void;
  handleEditHabit: (habit: Habit) => void;
  handleEditObjective: (objective: Objective) => void;
  handleEditTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  handleDateSelect: (date: Date) => void;
}

export const ViewManager: React.FC<ViewManagerProps> = ({
  viewMode,
  filteredHabits,
  filteredObjectives,
  filteredTasks,
  todayHabits,
  habits,
  logs,
  weeklyInsights,
  stats,
  toggleHabitLog,
  handleEditHabit,
  handleEditObjective,
  handleEditTask,
  toggleTask,
  deleteTask,
  handleDateSelect,
}) => {
  return (
    <div className="relative space-y-12 lg:col-span-8">
      {viewMode === 'habits' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              logs={logs}
              onToggle={(id) => toggleHabitLog(id, new Date())}
              onEdit={handleEditHabit}
              onAddNote={(id, note) => toggleHabitLog(id, new Date(), undefined, note)}
            />
          ))}
          {filteredHabits.length === 0 && (
            <div className="iterum-card col-span-full border-dashed py-20 text-center">
              <p className="text-text-muted">No hay hábitos activos. Crea uno para empezar.</p>
            </div>
          )}
        </div>
      ) : viewMode === 'objectives' ? (
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {[...filteredObjectives]
            .sort((a, b) => b.progress - a.progress)
            .map((objective) => (
            <div key={objective.id} className="break-inside-avoid">
              <ObjectiveCard
                objective={objective}
                onEdit={handleEditObjective}
              />
            </div>
          ))}
          {filteredObjectives.length === 0 && (
            <div className="iterum-card col-span-full border-dashed py-20 text-center flex flex-col items-center gap-4">
              <span className="text-[#c9935a] opacity-50 text-4xl">✧</span>
              <p className="text-text-muted font-serif italic text-sm tracking-widest">
                El firmamento está vacío. <br/> Forja una [ Meta: ] para encender las estrellas.
              </p>
            </div>
          )}
        </div>
      ) : viewMode === 'journal' ? (
        <JournalView weeklyInsights={weeklyInsights} />
      ) : viewMode === 'today' ? (
        <div className="space-y-12">
          {todayHabits.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-accent flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase">
                <span className="bg-accent h-1.5 w-1.5 rounded-full"></span>
                Hábitos de Hoy
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {todayHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    logs={logs}
                    onToggle={(id) => toggleHabitLog(id, new Date())}
                    onEdit={handleEditHabit}
                    onAddNote={(id, note) => toggleHabitLog(id, new Date(), undefined, note)}
                    compact
                  />
                ))}
              </div>
            </section>
          )}

          <ListView
            tasks={filteredTasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={handleEditTask}
          />
        </div>
      ) : viewMode === 'week' ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Análisis Semanal</h2>
              <p className="text-text-muted text-sm dark:text-[--dark-text-muted]">
                Tu evolución y patrones de conducta
              </p>
            </div>
          </div>
          <WeekView habits={habits} logs={logs} appLevel={stats.level} />
        </div>
      ) : (
        <CalendarView
          tasks={filteredTasks}
          onDateSelect={handleDateSelect}
          onToggle={toggleTask}
          onEdit={handleEditTask}
        />
      )}
    </div>
  );
};
