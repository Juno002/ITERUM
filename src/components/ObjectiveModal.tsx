import { useState, useEffect, FormEvent } from 'react';
import { X, Target, Zap, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Objective, Milestone } from '../types';
import { cn } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import { useHabitStore } from '../store/useHabitStore';

interface ObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (objective: Omit<Objective, 'id' | 'isActive' | 'createdAt'>) => void;
  objectiveToEdit?: Objective;
}

const COLORS = [
  '#C9935A', // Amber (Iterum)
  '#A0522D', // Terracotta (Iterum)
  '#ef4444', // red
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
];

export function ObjectiveModal({ isOpen, onClose, onSave, objectiveToEdit }: ObjectiveModalProps) {
  const habits = useHabitStore(state => state.habits);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState(100);
  const [currentValue, setCurrentValue] = useState(0);
  const [unit, setUnit] = useState('%');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [linkedHabitId, setLinkedHabitId] = useState<string | undefined>(undefined);

  const linkedHabits = habits.filter(h => 
    (objectiveToEdit && h.objectiveIds?.includes(objectiveToEdit.id)) ||
    (h.id === linkedHabitId)
  );

  useEffect(() => {
    if (isOpen) {
      if (objectiveToEdit) {
        setTitle(objectiveToEdit.title);
        setDescription(objectiveToEdit.description || '');
        setTargetValue(objectiveToEdit.targetValue);
        setCurrentValue(objectiveToEdit.currentValue);
        setUnit(objectiveToEdit.unit);
        setDeadline(objectiveToEdit.deadline ? format(objectiveToEdit.deadline, 'yyyy-MM-dd') : '');
        setColor(objectiveToEdit.color || COLORS[0]);
        setMilestones(objectiveToEdit.milestones || []);
        setLinkedHabitId(objectiveToEdit.linkedHabitId);
      } else {
        setTitle('');
        setDescription('');
        setTargetValue(100);
        setCurrentValue(0);
        setUnit('%');
        setDeadline('');
        setColor(COLORS[0]);
        setMilestones([]);
        setLinkedHabitId(undefined);
      }
    }
  }, [isOpen, objectiveToEdit]);

  if (!isOpen) return null;

  const addMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    const newMilestone: Milestone = {
      id: uuidv4(),
      title: newMilestoneTitle.trim(),
      completed: false,
    };
    setMilestones([...milestones, newMilestone]);
    setNewMilestoneTitle('');
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const toggleMilestone = (id: string) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date() : undefined } : m
    ));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      targetValue,
      currentValue,
      unit,
      deadline: deadline ? new Date(deadline) : undefined,
      color,
      milestones,
      linkedHabitId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/40 dark:bg-black/60 backdrop-blur-md">
      <div 
        className="bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-border-subtle dark:border-[--dark-border-subtle]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-border-subtle dark:border-[--dark-border-subtle]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-accent-secondary" />
            {objectiveToEdit ? 'Editar Objetivo' : 'Nuevo Objetivo'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-accent bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[12px] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto iterum-scrollbar">
          <div>
            <label htmlFor="title" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              Título del Objetivo
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="iterum-input w-full text-lg font-semibold"
              placeholder="Ej: Correr Maratón"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="target" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                Meta
              </label>
              <input
                id="target"
                type="number"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="iterum-input w-full"
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                Unidad
              </label>
              <input
                id="unit"
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="iterum-input w-full"
                placeholder="%, km, etc"
              />
            </div>
          </div>

          <div>
            <label htmlFor="deadline" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              Fecha Límite (Opcional)
            </label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="iterum-input w-full [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          <div>
            <label htmlFor="linkedHabit" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              Vincular Hábito (Progreso Automático)
            </label>
            <select
              id="linkedHabit"
              value={linkedHabitId || ''}
              onChange={(e) => setLinkedHabitId(e.target.value || undefined)}
              className="iterum-input w-full appearance-none bg-bg-secondary dark:bg-[--dark-bg-secondary]"
            >
              <option value="">Ninguno (Progreso Manual)</option>
              {habits.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.type === 'numeric' ? 'Suma valores' : 'Cuenta check-ins'})</option>
              ))}
            </select>
          </div>

          {objectiveToEdit && linkedHabits.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
                Hábitos Contribuyentes
              </label>
              <div className="space-y-2">
                {linkedHabits.map(habit => (
                  <div key={habit.id} className="flex items-center gap-3 p-3 bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[14px] border border-border-subtle dark:border-[--dark-border-subtle]">
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${habit.color}20` }}>
                      <Zap className="w-4 h-4" style={{ color: habit.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{habit.name}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">{habit.type === 'numeric' ? 'Cuantitativo' : 'Check-in'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
              Hitos (Milestones)
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                  className="iterum-input flex-1"
                  placeholder="Nuevo hito..."
                />
                <button
                  type="button"
                  onClick={addMilestone}
                  className="p-3 bg-accent/10 text-accent rounded-[14px] hover:bg-accent/20 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                {milestones.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[14px] border border-border-subtle dark:border-[--dark-border-subtle] group">
                    <button
                      type="button"
                      onClick={() => toggleMilestone(m.id)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        m.completed ? "bg-accent border-accent text-bg-primary" : "border-text-muted/30"
                      )}
                    >
                      {m.completed && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                    <span className={cn("flex-1 text-sm font-medium", m.completed && "line-through text-text-muted")}>
                      {m.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      className="p-1.5 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="iterum-input w-full resize-none"
              placeholder="¿Por qué es importante este objetivo?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
              Color Distintivo
            </label>
            <div className="flex items-center gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all border-2",
                    color === c ? "scale-125 border-text-primary shadow-lg" : "border-transparent hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="iterum-button-primary"
            >
              {objectiveToEdit ? 'Guardar Cambios' : 'Crear Objetivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
