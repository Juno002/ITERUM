import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Focus,
  ListTodo,
  Plus,
  Repeat,
  Target,
} from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react';
import { Habit, HabitLog, Task } from '../types';
import { useUIStore } from '../store/useUIStore';
import { useTaskStore } from '../store/useTaskStore';
import { cn } from '../utils';
import { feedback } from '../utils/feedback';
import { UniversalForge } from './UniversalForge';

function TaskRow({ task, onSelect }: { task: Task; onSelect: (task: Task) => void }) {
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const x = useMotionValue(0);
  const backgroundColor = useTransform(x, [0, 120], ['rgba(0,0,0,0)', 'rgba(21,61,36,0.16)']);

  const completeTask = () => {
    feedback.success();
    toggleTask(task.id);
  };

  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) completeTask();
        }}
        style={{ x, backgroundColor }}
        className="group flex items-center gap-3 rounded-[22px] border border-border-subtle bg-bg-primary px-4 py-3 shadow-sm transition-colors hover:border-accent/40 dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]"
      >
        <button
          type="button"
          onClick={completeTask}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-border-subtle text-text-muted transition-colors hover:border-accent hover:text-accent"
          aria-label={`Completar ${task.title}`}
        >
          <Circle className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onSelect(task)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-bold text-text-primary">{task.title}</p>
          <p className="mt-1 text-[11px] text-text-muted">
            {task.description || format(task.date, "HH:mm 'h'")}
          </p>
        </button>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-text-muted opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100" />
      </motion.div>
    </motion.li>
  );
}

interface AtriumProps {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  streak: number;
  onOpenHabits: () => void;
  onOpenObjectives: () => void;
  onOpenJournal: () => void;
  onNewTask: () => void;
  onNewHabit: () => void;
  onNewObjective: () => void;
  onTaskSelect: (task: Task) => void;
  onHabitToggle: (id: string) => void;
  onHabitSelect: (habit: Habit) => void;
}

export function Atrium({
  tasks,
  habits,
  habitLogs,
  streak,
  onOpenHabits,
  onOpenObjectives,
  onOpenJournal,
  onNewTask,
  onNewHabit,
  onNewObjective,
  onTaskSelect,
  onHabitToggle,
  onHabitSelect,
}: AtriumProps) {
  const { focusedTaskId, setFocusState } = useUIStore();
  const [showAllTasks, setShowAllTasks] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const openTasks = tasks.filter((task) => !task.completed && task.type === 'task');
  const completedToday = habitLogs.filter((log) => log.date === todayStr && log.completed).length;
  const primaryTask = useMemo(
    () => openTasks.find((task) => task.id === focusedTaskId) ?? openTasks[0],
    [focusedTaskId, openTasks],
  );
  const secondaryTasks = openTasks.filter((task) => task.id !== primaryTask?.id);
  const visibleTasks = showAllTasks ? secondaryTasks : secondaryTasks.slice(0, 4);
  const visibleHabits = habits.slice(0, 4);

  const startFocus = (task: Task) => {
    setFocusState('focused', task.id);
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,147,90,0.14),transparent_32rem)] px-4 pb-32 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] text-text-muted uppercase">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
              Hoy
            </h1>
          </div>
          <div className="rounded-full border border-border-subtle bg-bg-primary px-4 py-2 text-right shadow-sm">
            <p className="text-[10px] font-bold tracking-[0.14em] text-text-muted uppercase">Racha</p>
            <p className="text-sm font-black text-accent">{streak} días</p>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={onNewTask} className="iterum-card flex items-center gap-3 p-4 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-bg-primary">
              <Plus className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black">Nueva tarea</span>
              <span className="text-xs text-text-muted">Algo que puedas cerrar hoy.</span>
            </span>
          </button>
          <button type="button" onClick={onNewHabit} className="iterum-card flex items-center gap-3 p-4 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-secondary text-accent">
              <Repeat className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black">Nuevo hábito</span>
              <span className="text-xs text-text-muted">Una repetición pequeña.</span>
            </span>
          </button>
          <button type="button" onClick={onNewObjective} className="iterum-card flex items-center gap-3 p-4 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-secondary text-accent">
              <Target className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black">Nueva meta</span>
              <span className="text-xs text-text-muted">Un resultado medible.</span>
            </span>
          </button>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[30px] border border-border-subtle bg-bg-primary p-5 shadow-sm dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-accent uppercase">
                  Tarea principal
                </p>
                <p className="mt-1 text-xs text-text-muted">La primera pendiente se vuelve foco automáticamente.</p>
              </div>
              {primaryTask && (
                <button
                  type="button"
                  onClick={() => startFocus(primaryTask)}
                  className="rounded-full border border-border-subtle px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-text-muted uppercase transition-colors hover:border-accent hover:text-accent"
                >
                  Modo foco
                </button>
              )}
            </div>

            {primaryTask ? (
              <motion.div layoutId={primaryTask.id} className="rounded-[26px] bg-bg-secondary p-5">
                <h2 className="text-2xl font-black leading-tight text-text-primary">{primaryTask.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {primaryTask.description || 'Sin descripción. Tócala para editar o completa cuando esté lista.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onTaskSelect(primaryTask)}
                    className="rounded-full bg-text-primary px-4 py-2 text-xs font-bold tracking-[0.12em] text-bg-primary uppercase"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => startFocus(primaryTask)}
                    className="flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 text-xs font-bold tracking-[0.12em] text-text-primary uppercase"
                  >
                    <Focus className="h-3.5 w-3.5" />
                    Enfocar
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={onNewTask}
                className="flex w-full flex-col items-start rounded-[26px] border border-dashed border-border-subtle bg-bg-secondary/60 p-5 text-left"
              >
                <span className="text-xl font-black text-text-primary">No hay tareas pendientes.</span>
                <span className="mt-2 text-sm text-text-muted">
                  Crea una tarea y aparecerá aquí al instante como foco del día.
                </span>
              </button>
            )}
          </div>

          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <button type="button" onClick={onOpenHabits} className="rounded-[24px] border border-border-subtle bg-bg-primary p-4 text-left shadow-sm">
              <div className="flex items-center justify-between">
                <Repeat className="h-5 w-5 text-accent" />
                <span className="text-lg font-black text-text-primary">
                  {completedToday}/{habits.length}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold tracking-[0.14em] text-text-muted uppercase">Hábitos</p>
            </button>
            <button type="button" onClick={onOpenObjectives} className="rounded-[24px] border border-border-subtle bg-bg-primary p-4 text-left shadow-sm">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-accent" />
                <span className="text-lg font-black text-text-primary">Metas</span>
              </div>
              <p className="mt-3 text-xs font-bold tracking-[0.14em] text-text-muted uppercase">Ver progreso</p>
            </button>
            <button type="button" onClick={onOpenJournal} className="rounded-[24px] border border-border-subtle bg-bg-primary p-4 text-left shadow-sm">
              <div className="flex items-center justify-between">
                <BookOpen className="h-5 w-5 text-accent" />
                <span className="text-lg font-black text-text-primary">Diario</span>
              </div>
              <p className="mt-3 text-xs font-bold tracking-[0.14em] text-text-muted uppercase">Notas locales</p>
            </button>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[30px] border border-border-subtle bg-bg-primary p-5 shadow-sm dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black tracking-[0.14em] text-text-primary uppercase">
                <ListTodo className="h-4 w-4 text-accent" />
                Pendientes
              </h2>
              <span className="text-xs font-bold text-text-muted">{secondaryTasks.length}</span>
            </div>
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {visibleTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onSelect={onTaskSelect} />
                ))}
              </AnimatePresence>
            </ul>
            {secondaryTasks.length === 0 && (
              <p className="rounded-[22px] border border-dashed border-border-subtle p-4 text-sm text-text-muted">
                No hay más tareas. La tarea principal concentra el día.
              </p>
            )}
            {secondaryTasks.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllTasks((value) => !value)}
                className="mt-4 text-xs font-bold tracking-[0.14em] text-accent uppercase"
              >
                {showAllTasks ? 'Ver menos' : `Ver ${secondaryTasks.length - 4} más`}
              </button>
            )}
          </div>

          <div className="rounded-[30px] border border-border-subtle bg-bg-primary p-5 shadow-sm dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black tracking-[0.14em] text-text-primary uppercase">
                <Repeat className="h-4 w-4 text-accent" />
                Hábitos de hoy
              </h2>
              <button type="button" onClick={onOpenHabits} className="text-xs font-bold text-accent">
                Ver todos
              </button>
            </div>
            <div className="space-y-3">
              {visibleHabits.map((habit) => {
                const done = habitLogs.some(
                  (log) => log.habitId === habit.id && log.date === todayStr && log.completed,
                );

                return (
                  <div key={habit.id} className="flex items-center gap-3 rounded-[22px] bg-bg-secondary p-3">
                    <button
                      type="button"
                      onClick={() => onHabitToggle(habit.id)}
                      className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border transition-all',
                        done
                          ? 'border-accent bg-accent text-bg-primary'
                          : 'border-border-subtle bg-bg-primary text-text-muted',
                      )}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
                    </button>
                    <button type="button" onClick={() => onHabitSelect(habit)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-bold text-text-primary">{habit.name}</p>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {done ? 'Completado hoy' : 'Pendiente para hoy'}
                      </p>
                    </button>
                  </div>
                );
              })}
              {visibleHabits.length === 0 && (
                <button
                  type="button"
                  onClick={onNewHabit}
                  className="w-full rounded-[22px] border border-dashed border-border-subtle p-4 text-left text-sm text-text-muted"
                >
                  Crea un hábito y se verá aquí sin cambiar de pantalla.
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <UniversalForge isFabExpanded />
    </div>
  );
}
