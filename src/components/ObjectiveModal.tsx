import { useState, FormEvent } from 'react';
import { X, Target, Zap, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Objective, Milestone } from '../types';
import { cn } from '../utils';
import { useHabitStore } from '../store/useHabitStore';

interface ObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (objective: Omit<Objective, 'id' | 'createdAt'>) => void;
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
  const habits = useHabitStore((state) => state.habits);
  const [title, setTitle] = useState(objectiveToEdit?.title ?? '');
  const [description, setDescription] = useState(objectiveToEdit?.description ?? '');
  const [targetValue, setTargetValue] = useState(objectiveToEdit?.targetValue ?? 100);
  const currentValue = objectiveToEdit?.currentValue ?? 0;
  const [unit, setUnit] = useState(objectiveToEdit?.unit ?? '%');
  const [deadline, setDeadline] = useState(
    objectiveToEdit?.deadline ? format(objectiveToEdit.deadline, 'yyyy-MM-dd') : '',
  );
  const [color, setColor] = useState(objectiveToEdit?.color ?? COLORS[0]);
  const [milestones, setMilestones] = useState<Milestone[]>(objectiveToEdit?.milestones ?? []);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [linkedHabitId, setLinkedHabitId] = useState<string | undefined>(objectiveToEdit?.linkedHabitId);

  const linkedHabits = habits.filter(
    (h) =>
      (objectiveToEdit && h.objectiveIds?.includes(objectiveToEdit.id)) || h.id === linkedHabitId,
  );

  if (!isOpen) return null;

  const addMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      title: newMilestoneTitle.trim(),
      completed: false,
    };
    setMilestones([...milestones, newMilestone]);
    setNewMilestoneTitle('');
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const toggleMilestone = (id: string) => {
    setMilestones(
      milestones.map((m) =>
        m.id === id
          ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date() : undefined }
          : m,
      ),
    );
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
      status: objectiveToEdit?.status || 'active',
      progress: targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0,
      milestones,
      linkedHabitId,
    });
    onClose();
  };

  return (
    <div className="bg-bg-primary/40 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md dark:bg-black/60">
      <div
        className="bg-bg-primary animate-in fade-in zoom-in-95 border-border-subtle fixed inset-x-0 bottom-0 w-full overflow-hidden rounded-t-[28px] border shadow-2xl duration-300 sm:relative sm:inset-auto sm:max-w-md sm:rounded-[24px] dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-border-subtle flex items-center justify-between border-b px-8 py-6 dark:border-[--dark-border-subtle]">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Target className="text-accent-secondary h-5 w-5" />
            {objectiveToEdit ? 'Editar Objetivo' : 'Nuevo Objetivo'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-accent bg-bg-secondary rounded-[12px] p-2 transition-colors dark:bg-[--dark-bg-secondary]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="iterum-scrollbar max-h-[82vh] space-y-6 overflow-y-auto p-6 sm:max-h-[70vh] sm:p-8"
        >
          <div className="rounded-[18px] border border-accent/20 bg-accent/5 p-4">
            <p className="text-[10px] font-bold tracking-[0.18em] text-accent uppercase">
              Meta medible
            </p>
            <p className="mt-2 text-sm text-text-primary">
              Define un resultado claro y, si quieres, vincúlalo a un hábito para que el progreso se actualice automáticamente.
            </p>
          </div>

          <div>
            <label
              htmlFor="title"
              className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
            >
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
              <label
                htmlFor="target"
                className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
              >
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
              <label
                htmlFor="unit"
                className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
              >
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
            <label
              htmlFor="deadline"
              className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
            >
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
            <label
              htmlFor="linkedHabit"
              className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
            >
              Vincular Hábito (Progreso Automático)
            </label>
            <select
              id="linkedHabit"
              value={linkedHabitId || ''}
              onChange={(e) => setLinkedHabitId(e.target.value || undefined)}
              className="iterum-input bg-bg-secondary w-full appearance-none dark:bg-[--dark-bg-secondary]"
            >
              <option value="">Ninguno (Progreso Manual)</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.type === 'numeric' ? 'Suma valores' : 'Cuenta check-ins'})
                </option>
              ))}
            </select>
          </div>

          {objectiveToEdit && linkedHabits.length > 0 && (
            <div>
              <label className="text-text-muted mb-3 block text-xs font-bold tracking-widest uppercase">
                Hábitos Contribuyentes
              </label>
              <div className="space-y-2">
                {linkedHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="bg-bg-secondary border-border-subtle flex items-center gap-3 rounded-[14px] border p-3 dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-[8px]"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      <Zap className="h-4 w-4" style={{ color: habit.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{habit.name}</p>
                      <p className="text-text-muted text-[10px] tracking-wider uppercase">
                        {habit.type === 'numeric' ? 'Cuantitativo' : 'Check-in'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-text-muted mb-3 block text-xs font-bold tracking-widest uppercase">
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
                  className="bg-accent/10 text-accent hover:bg-accent/20 rounded-[14px] p-3 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="bg-bg-secondary border-border-subtle group flex items-center gap-3 rounded-[14px] border p-3 dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMilestone(m.id)}
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                        m.completed
                          ? 'bg-accent border-accent text-bg-primary'
                          : 'border-text-muted/30',
                      )}
                    >
                      {m.completed && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                    <span
                      className={cn(
                        'flex-1 text-sm font-medium',
                        m.completed && 'text-text-muted line-through',
                      )}
                    >
                      {m.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      className="text-text-muted p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
            >
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
            <label className="text-text-muted mb-3 block text-xs font-bold tracking-widest uppercase">
              Color Distintivo
            </label>
            <div className="flex items-center gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all',
                    color === c
                      ? 'border-text-primary scale-125 shadow-lg'
                      : 'border-transparent hover:scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 -mx-6 border-t border-border-subtle bg-bg-primary/95 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:static sm:m-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-text-muted hover:text-text-primary px-6 py-3 text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              <button type="submit" className="iterum-button-primary min-w-[140px] justify-center">
                {objectiveToEdit ? 'Guardar cambios' : 'Crear objetivo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
