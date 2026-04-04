import React from 'react';
import { Target, Calendar, ChevronRight, Edit2, CheckCircle2, Circle } from 'lucide-react';
import { Objective, Milestone } from '../types';
import { cn } from '../utils';
import { motion } from 'motion/react';

interface ObjectiveCardProps {
  objective: Objective;
  onEdit: (objective: Objective) => void;
  onToggleMilestone?: (objectiveId: string, milestoneId: string) => void;
}

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({ objective, onEdit, onToggleMilestone }) => {
  const progress = Math.min(100, Math.round((objective.currentValue / objective.targetValue) * 100));
  const completedMilestones = objective.milestones?.filter(m => m.completed).length || 0;
  const totalMilestones = objective.milestones?.length || 0;
  
  return (
    <motion.div 
      layout
      className="iterum-card p-6 flex flex-col gap-6 group relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight">{objective.title}</h3>
          </div>
          {objective.description && (
            <p className="text-sm text-text-muted line-clamp-2">{objective.description}</p>
          )}
        </div>
        
        <button 
          onClick={() => onEdit(objective)}
          className="p-2 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Progreso</span>
            <span className="text-2xl font-bold text-accent">
              {objective.currentValue} <span className="text-sm font-medium text-text-muted">/ {objective.targetValue} {objective.unit}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold">{progress}%</span>
          </div>
        </div>

        <div className="h-3 bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-full overflow-hidden border border-border-subtle dark:border-[--dark-border-subtle]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(201,147,90,0.3)]"
            style={{ backgroundColor: objective.color }}
          />
        </div>
      </div>

      {objective.milestones && objective.milestones.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Hitos ({completedMilestones}/{totalMilestones})</span>
          </div>
          <div className="space-y-2">
            {objective.milestones.map((milestone) => (
              <button
                key={milestone.id}
                onClick={() => onToggleMilestone?.(objective.id, milestone.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-[12px] border transition-all text-left",
                  milestone.completed 
                    ? "bg-accent/5 border-accent/20 text-text-primary" 
                    : "bg-bg-secondary/50 border-border-subtle text-text-muted hover:border-accent/30"
                )}
              >
                {milestone.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-text-muted/30 shrink-0" />
                )}
                <span className={cn("text-xs font-medium", milestone.completed && "line-through opacity-60")}>
                  {milestone.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border-subtle dark:border-[--dark-border-subtle]">
        <div className="flex items-center gap-4">
          {objective.deadline && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(objective.deadline).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent">
          Detalles
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
};
