import { useState } from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { cn } from '../utils';
import { feedback } from '../utils/feedback';

interface ListViewProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

export function ListView({ tasks, onToggle, onDelete, onEdit }: ListViewProps) {
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);

  const sortedTasks = [...tasks].sort((a, b) => a.date.getTime() - b.date.getTime());

  const groupedTasks = sortedTasks.reduce(
    (acc, task) => {
      const dateKey = format(task.date, 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  const handleToggle = (task: Task) => {
    if (task.completed) {
      feedback.undo();
    } else {
      feedback.success();
      setLastCompletedId(task.id);
      setTimeout(() => setLastCompletedId(null), 600);
    }
    onToggle(task.id);
  };

  if (tasks.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[--dark-bg-secondary]">
          <Clock className="h-8 w-8 text-zinc-400 dark:text-[--dark-text-muted]" />
        </div>
        <h3 className="mb-1 text-lg font-medium text-text-primary dark:text-[--dark-text-primary]">No hay tareas</h3>
        <p className="max-w-sm text-text-muted dark:text-[--dark-text-muted]">
          No se encontraron tareas. Comienza agregando una nueva o usa la búsqueda.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      <AnimatePresence mode="popLayout">
        {Object.entries(groupedTasks).map(([dateString, dayTasks]) => (
          <motion.div layout key={dateString} className="space-y-6">
            <motion.h2 layout className="text-accent flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase">
              <span className="bg-accent h-1.5 w-1.5 rounded-full"></span>
              {getDateLabel(dateString)}
            </motion.h2>

            <motion.div layout className="space-y-3">
              <AnimatePresence mode="popLayout">
                {dayTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout // Animate layout changes smoothly
                    variants={itemVariants}
                    className={cn(
                      'group iterum-card relative flex items-center gap-5 border-none p-5 transition-all hover:translate-x-1',
                      task.completed && 'opacity-50 grayscale-[0.5]',
                    )}
                  >
                    {/* Ring Pulse Effect on completion */}
                    <AnimatePresence>
                      {lastCompletedId === task.id && (
                        <motion.div
                          className="bg-accent/10 absolute inset-0 rounded-[24px]"
                          initial={{ opacity: 0.6, scale: 0.9 }}
                          animate={{ opacity: 0, scale: 1.05 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => handleToggle(task)}
                      className="flex-shrink-0 transition-all duration-300 relative z-10"
                    >
                      {task.completed ? (
                        <motion.div 
                          initial={lastCompletedId === task.id ? { scale: 0, rotate: -180 } : false}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                          className="bg-accent flex h-6 w-6 items-center justify-center rounded-full"
                        >
                          <CheckCircle2 className="text-bg-primary h-4 w-4" />
                        </motion.div>
                      ) : (
                        <div className="border-border-subtle group-hover:border-accent h-6 w-6 rounded-full border-2 transition-colors" />
                      )}
                    </motion.button>

                    <div className="min-w-0 flex-1 relative z-10">
                      <div className="mb-1 flex items-center gap-3">
                        <h3
                          className={cn(
                            'truncate text-lg font-semibold transition-all',
                            task.completed && 'text-text-muted line-through',
                          )}
                        >
                          {task.title}
                        </h3>
                        {task.type !== 'task' && (
                          <span className="bg-accent/10 text-accent border-accent/20 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                            {task.type}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p
                          className={cn(
                            'text-text-muted line-clamp-1 text-sm transition-all',
                            task.completed && 'line-through',
                          )}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 opacity-0 transition-opacity group-hover:opacity-100 relative z-10">
                      <div className="text-text-muted flex items-center gap-1 text-xs font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {format(task.date, 'HH:mm')}
                      </div>
                      <div className="bg-border-subtle h-4 w-[1px]" />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          feedback.tap();
                          onEdit(task);
                        }}
                        className="text-text-muted hover:text-accent p-1.5 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          feedback.error(); // Use error sound for deletions as a warning
                          onDelete(task.id);
                        }}
                        className="text-text-muted hover:text-accent-secondary p-1.5 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
