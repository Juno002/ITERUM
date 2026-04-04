import React, { useState, useEffect } from 'react';
import { CheckCircle2, Flame, Target, Edit2, MoreVertical, MessageSquare, Save } from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { cn } from '../utils';
import { calculateCurrentStreak } from '../utils/habitUtils';
import { motion, AnimatePresence } from 'motion/react';

interface HabitCardProps {
  habit: Habit;
  logs: HabitLog[];
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onAddNote?: (id: string, note: string) => void;
  compact?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, logs, onToggle, onEdit, onAddNote, compact = false }) => {
  const [isReflecting, setIsReflecting] = useState(false);
  const [note, setNote] = useState('');
  
  const streak = calculateCurrentStreak(logs, habit);
  const todayStr = new Date().toISOString().split('T')[0];
  const currentLog = logs.find(l => l.habitId === habit.id && l.date === todayStr);
  const isCompletedToday = currentLog?.completed || false;

  const handleSaveNote = () => {
    if (onAddNote) {
      onAddNote(habit.id, note);
      setIsReflecting(false);
    }
  };

  useEffect(() => {
    if (currentLog?.note) {
      setNote(currentLog.note);
    }
  }, [currentLog]);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 iterum-card border-none hover:translate-x-1 transition-all">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onToggle(habit.id)}
            className="flex-shrink-0"
          >
            {isCompletedToday ? (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                <CheckCircle2 className="w-5 h-5 text-bg-primary" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-border-subtle hover:border-accent transition-colors" />
            )}
          </button>
          <div>
            <h4 className={cn("font-bold text-sm", isCompletedToday && "text-text-muted line-through")}>
              {habit.name}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-text-muted uppercase tracking-wider font-bold">
              <Flame className={cn("w-3 h-3", streak > 0 ? "text-accent" : "text-text-muted")} />
              {streak} días
            </div>
          </div>
        </div>
        {isCompletedToday && onAddNote && (
          <button 
            onClick={() => setIsReflecting(!isReflecting)}
            className={cn(
              "p-2 rounded-full transition-colors",
              currentLog?.note ? "text-accent bg-accent/10" : "text-text-muted hover:text-accent"
            )}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div 
      layout
      className="iterum-card p-6 flex flex-col gap-4 group relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight">{habit.name}</h3>
            {habit.category && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                {habit.category}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted font-medium uppercase tracking-widest">
            {habit.frequency === 'daily' ? 'Cada día' : habit.frequency}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isCompletedToday && (
            <button 
              onClick={() => setIsReflecting(!isReflecting)}
              className={cn(
                "p-2 rounded-full transition-all",
                currentLog?.note ? "text-accent bg-accent/10" : "text-text-muted hover:text-accent opacity-0 group-hover:opacity-100"
              )}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => onEdit(habit)}
            className="p-2 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-text-muted hover:text-accent">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isReflecting && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 items-end pt-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="¿Cómo te sentiste hoy con este hábito?"
                className="flex-1 iterum-input py-2 text-sm resize-none h-20"
                autoFocus
              />
              <button 
                onClick={handleSaveNote}
                className="p-3 bg-accent text-bg-primary rounded-[12px] hover:opacity-90 transition-all"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end justify-between mt-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
            streak > 0 ? "bg-accent/10 text-accent" : "bg-bg-secondary text-text-muted"
          )}>
            <Flame className="w-4 h-4" />
            {streak} días racha
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-bg-secondary text-text-muted">
            <Target className="w-4 h-4" />
            {habit.type === 'numeric' ? `${habit.targetValue} ${habit.unit}` : 'Check'}
          </div>
        </div>

        <button 
          onClick={() => onToggle(habit.id)}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
            isCompletedToday 
              ? "bg-accent text-bg-primary shadow-accent/30 scale-95" 
              : "bg-bg-secondary text-text-muted hover:bg-accent/10 hover:text-accent border border-border-subtle"
          )}
        >
          {isCompletedToday ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-current" />
          )}
        </button>
      </div>

      {/* Progress Bar for Numeric Habits (Optional Visual) */}
      {habit.type === 'numeric' && (
        <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-accent transition-all duration-1000" 
            style={{ width: isCompletedToday ? '100%' : '0%' }}
          />
        </div>
      )}
    </motion.div>
  );
};
