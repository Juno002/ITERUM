import { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { DayClosure, Task, Habit, HabitLog } from '../types';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface CloseDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<DayClosure | null>;
  tasks: Task[];
  habits: Habit[];
  logs: HabitLog[];
}

export function CloseDayModal({ isOpen, onClose, onConfirm, tasks, habits, logs }: CloseDayModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [closure, setClosure] = useState<DayClosure | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter(t => format(t.date, 'yyyy-MM-dd') === todayStr);
  const todayLogs = logs.filter(l => l.date === todayStr);
  
  const completedTasks = todayTasks.filter(t => t.completed).length;
  const pendingTasks = todayTasks.filter(t => !t.completed).length;
  
  const completedHabits = habits.filter(h => todayLogs.find(l => l.habitId === h.id && l.completed)).length;
  // We don't easily know total habits for today here without the utility, 
  // but we can just show completed vs pending tasks for now.

  const handleCloseDay = async () => {
    setIsClosing(true);
    setError(null);
    try {
      const result = await onConfirm();
      if (result) {
        setClosure(result);
      } else {
        setError("El día ya está cerrado o hubo un error.");
      }
    } catch (e) {
      console.error('Close day failed', e);
      setError("No se pudo cerrar el día. Inténtalo de nuevo.");
    } finally {
      setIsClosing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/40 dark:bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-border-subtle dark:border-[--dark-border-subtle]"
        onClick={(e) => e.stopPropagation()}
      >
        {!closure ? (
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Cerrar Jornada</h2>
                <p className="text-sm text-text-muted">Repasa tu progreso antes de archivar el día.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-text-muted hover:text-accent bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[12px] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[20px] border border-border-subtle dark:border-[--dark-border-subtle] space-y-2">
                <div className="flex items-center gap-2 text-accent">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Completado</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{completedTasks + completedHabits}</span>
                  <span className="text-xs text-text-muted">ítems</span>
                </div>
              </div>
              <div className="p-4 bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[20px] border border-border-subtle dark:border-[--dark-border-subtle] space-y-2">
                <div className="flex items-center gap-2 text-accent-secondary">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Pendiente</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{pendingTasks}</span>
                  <span className="text-xs text-text-muted">ítems</span>
                </div>
              </div>
            </div>

            {pendingTasks > 0 && (
              <div className="p-4 bg-accent/5 rounded-[20px] border border-accent/10 flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-accent mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Migración Automática</p>
                  <p className="text-xs text-text-muted">
                    {pendingTasks} tareas pendientes se moverán a mañana con el indicador "retrasado".
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 text-red-500 rounded-[16px] text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={handleCloseDay}
                disabled={isClosing}
                className={cn(
                  "w-full iterum-button-primary py-4 text-base flex items-center justify-center gap-3",
                  isClosing && "opacity-70 cursor-not-allowed"
                )}
              >
                {isClosing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                    Generando resumen IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Cerrar Día con IA
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent/10 rounded-[16px] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold tracking-tight">Resumen del Día</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {format(new Date(closure.date), 'dd MMMM yyyy')}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-text-muted hover:text-accent bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[12px] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[24px] border border-border-subtle dark:border-[--dark-border-subtle] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Sparkles className="w-24 h-24 text-accent" />
              </div>
              <div className="relative z-10 space-y-4">
                <p className="text-lg font-medium leading-relaxed italic text-text-primary dark:text-[--dark-text-primary]">
                  "{closure.summary}"
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" />
                Día Archivado con Éxito
              </div>
              <p className="text-sm text-text-muted">
                Tus tareas pendientes han sido migradas y tu racha ha sido actualizada. ¡Descansa, te lo has ganado!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full iterum-button-primary py-4 text-base"
            >
              Entendido
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
