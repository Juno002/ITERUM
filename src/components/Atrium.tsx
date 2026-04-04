import React, { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Task, Habit, Objective } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Target, Archive, Focus } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useTaskStore } from '../store/useTaskStore';
import { cn } from '../utils';
import { feedback } from '../utils/feedback';
import { UniversalForge } from './UniversalForge';

function ForgeTaskItem({ task, onSelect }: { task: Task, onSelect: (task: Task) => void }) {
  const toggleTask = useTaskStore(state => state.toggleTask);
  const x = useMotionValue(0);
  
  // Resistencia elástica: Transiciona de nada a verde bosque sutil
  const backgroundColor = useTransform(x, [0, 150], ['rgba(0,0,0,0)', 'rgba(21, 61, 36, 0.4)']);

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x > 120) {
      // Threshold cruzado: Completar asimétricamente
      feedback.success();
      if ('vibrate' in navigator) navigator.vibrate([20, 50, 20]);
      toggleTask(task.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative -mx-4 overflow-hidden rounded-2xl"
    >
      {/* Background layer for swipe indication */}
      <motion.div
         className="absolute inset-0 flex items-center px-6 pointer-events-none"
         style={{ opacity: useTransform(x, [0, 80], [0, 1]) }}
      >
        <span className="text-[#c9935a] font-bold uppercase text-[10px] tracking-widest">
           [ COMPLETAR ]
        </span>
      </motion.div>

      {/* Draggable Task Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{ x, backgroundColor }}
        className="group flex flex-col gap-1 cursor-pointer p-4 rounded-2xl hover:bg-bg-secondary transition-colors relative z-10"
        onClick={() => onSelect(task)}
      >
        <h3 className={cn("text-lg font-medium", task.completed && "line-through opacity-50")}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-text-muted line-clamp-1">{task.description}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

interface AtriumProps {
  tasks: Task[];
  habits: Habit[];
  streak: number;
  onNewTask: () => void;
  onTaskSelect: (task: Task) => void;
}

export function Atrium({ tasks, habits, streak, onNewTask, onTaskSelect }: AtriumProps) {
  const { focusState, focusedTaskId, setFocusState } = useUIStore();
  const { scrollYProgress, scrollY } = useScroll();
  const [isFabExpanded, setIsFabExpanded] = useState(true);

  // FAB Shrink logic on downward scroll
  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (current > previous && current > 50) {
      setIsFabExpanded(false);
    } else {
      setIsFabExpanded(true);
    }
  });

  const masterTask = tasks.find(t => t.id === focusedTaskId);

  // Get active incomplete tasks for the Forge
  const forgeTasks = tasks.filter(t => !t.completed && t.type === 'task' && t.id !== focusedTaskId);

  return (
    <div className="relative min-h-screen pb-32">
      {/* Zona Superior: El Silencio */}
      <header className="flex w-full items-center justify-between px-6 pt-12 pb-6">
        <div className="text-[10px] font-bold tracking-[0.15em] text-text-muted uppercase">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="h-[1px] w-12 bg-accent opacity-50" />
          <div className="text-[10px] font-bold tracking-[0.15em] text-accent uppercase">
            [ INTENCIÓN SOSTENIDA: DÍA {streak} ]
          </div>
        </div>
      </header>

      {/* Zona Central: El Obelisco */}
      <section className="flex flex-col items-center justify-center pt-10 pb-20 px-6 min-h-[40vh]">
        <AnimatePresence mode="popLayout">
          {masterTask ? (
            <motion.div
              layoutId={masterTask.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm"
              style={{ zIndex: focusState === 'entering' || focusState === 'exiting' ? 100 : 10 }}
              onPanStart={() => setFocusState('entering', masterTask.id)}
              onPanEnd={() => setFocusState('idle', masterTask.id)}
            >
              <div 
                className="iterum-card flex flex-col items-center gap-4 text-center cursor-pointer select-none [-webkit-touch-callout:none]"
                onContextMenu={(e) => e.preventDefault()}
              >
                <span className="text-[10px] font-bold tracking-[0.15em] text-accent uppercase">
                  Master Task
                </span>
                <h2 className="text-2xl font-bold font-sans tracking-tight leading-tight">
                  {masterTask.title}
                </h2>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-primary text-text-muted">
                  <Focus className="h-5 w-5" />
                </div>
                <p className="text-[10px] text-text-muted mt-2 tracking-widest uppercase">
                  MANTÉN PRESIONADO PARA ENTRAR A LA BÓVEDA
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              layout
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 cursor-pointer"
              onClick={onNewTask}
            >
              <div className="text-text-muted hover:text-text-primary transition-colors duration-500 ease-out flex flex-col items-center gap-3">
                <div className="h-0.5 w-8 bg-current opacity-20" />
                <h2 className="text-[12px] font-bold tracking-[0.3em] uppercase">
                  [ DEFINE TU NORTE ]
                </h2>
                <div className="h-0.5 w-8 bg-current opacity-20" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Zona Inferior: La Forja */}
      <section className="px-6 space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-border-subtle" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase">
            La Forja
          </span>
          <div className="h-[1px] flex-1 bg-border-subtle" />
        </div>

        <div className="space-y-6">
          {forgeTasks.map(task => (
             <ForgeTaskItem key={task.id} task={task} onSelect={onTaskSelect} />
          ))}
          {forgeTasks.length === 0 && (
            <div className="text-center py-10 text-text-muted text-sm italic">
              Sin tareas pendientes. El yunque está frío.
            </div>
          )}
        </div>

        {/* The Ceremony Trigger */}
        <AnimatePresence>
          {(masterTask?.completed || new Date().getHours() >= 20) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full pt-16 pb-10 flex justify-center"
            >
              <button 
                onClick={() => {
                  setFocusState('idle');
                  useUIStore.getState().setCeremonyState('entering');
                }}
                className="text-text-muted hover:text-accent transition-colors duration-700 ease-out flex flex-col items-center gap-3 cursor-pointer select-none"
              >
                <div className="h-0.5 w-12 bg-current opacity-20" />
                <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase">
                  [ SELLAR LA JORNADA ]
                </h2>
                <div className="h-0.5 w-12 bg-current opacity-20" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Universal Forge: Replaces traditional FAB with Command Palette */}
      <UniversalForge isFabExpanded={isFabExpanded} />

    </div>
  );
}
