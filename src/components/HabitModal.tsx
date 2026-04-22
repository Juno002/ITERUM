import { useState, FormEvent } from 'react';
import { X, type LucideIcon, Zap, Target, Clock, Sparkles } from 'lucide-react';
import { Habit, HabitType } from '../types';
import { cn } from '../utils';
import { useObjectiveStore } from '../store/useObjectiveStore';
import { useAppStatsStore } from '../store/useAppStatsStore';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'isActive' | 'createdAt'>) => void;
  habitToEdit?: Habit;
}

const COLORS = [
  '#C9935A', // Amber (Iterum)
  '#A0522D', // Terracotta (Iterum)
  '#ef4444', // red
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#64748b', // slate
];

const HABIT_TYPES: { type: HabitType; label: string; icon: LucideIcon }[] = [
  { type: 'yesno', label: 'Sí/No', icon: Zap },
  { type: 'numeric', label: 'Numérico', icon: Target },
  { type: 'timer', label: 'Timer', icon: Clock },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Cada día' },
  { value: 'weekly:Mon,Wed,Fri', label: 'Lun, Mié, Vie' },
  { value: 'weekly:Sat,Sun', label: 'Fines de semana' },
  { value: 'everyXdays:2', label: 'Cada 2 días' },
];

export function HabitModal(props: HabitModalProps) {
  const { isOpen, habitToEdit } = props;

  if (!isOpen) return null;

  return <HabitModalContent key={habitToEdit?.id ?? 'new'} {...props} />;
}

function HabitModalContent({ onClose, onSave, habitToEdit }: HabitModalProps) {
  const objectives = useObjectiveStore((state) => state.objectives);
  const appLevel = useAppStatsStore((state) => state.stats.level);
  const [name, setName] = useState(habitToEdit?.name ?? '');
  const [description, setDescription] = useState(habitToEdit?.description ?? '');
  const [frequency, setFrequency] = useState(habitToEdit?.frequency ?? 'daily');
  const [type, setType] = useState<HabitType>(habitToEdit?.type ?? 'yesno');
  const [targetValue, setTargetValue] = useState<number>(habitToEdit?.targetValue ?? 1);
  const [unit, setUnit] = useState(habitToEdit?.unit ?? '');
  const [category, setCategory] = useState(habitToEdit?.category ?? '');
  const [color, setColor] = useState(habitToEdit?.color ?? COLORS[0]);
  const [reminderTime, setReminderTime] = useState(habitToEdit?.reminderTime ?? '');
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>(
    habitToEdit?.objectiveIds ?? [],
  );
  const [isSuggesting, setIsSuggesting] = useState(false);

  const suggestLocally = () => {
    if (!name.trim()) return;
    setIsSuggesting(true);

    window.setTimeout(() => {
      const normalizedName = name.toLowerCase();
      const looksNumeric = ['leer', 'agua', 'pasos', 'km', 'correr', 'páginas', 'paginas'].some(
        (token) => normalizedName.includes(token),
      );
      const looksTimed = ['meditar', 'estudiar', 'entrenar', 'trabajar', 'foco'].some((token) =>
        normalizedName.includes(token),
      );

      setFrequency('daily');
      setCategory(looksTimed ? 'Foco' : looksNumeric ? 'Progreso' : 'Disciplina');
      setType(looksTimed ? 'timer' : looksNumeric ? 'numeric' : 'yesno');
      setTargetValue(looksTimed ? 20 : looksNumeric ? 1 : 1);
      setUnit(looksTimed ? 'min' : looksNumeric ? 'unidad' : '');
      setDescription((current) => current || 'Un hábito pequeño, claro y repetible para fortalecer tu día.');
      setIsSuggesting(false);
    }, 250);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      frequency,
      type,
      targetValue: type !== 'yesno' ? targetValue : undefined,
      unit: type !== 'yesno' ? unit : undefined,
      category: category.trim(),
      color,
      reminderTime: reminderTime || undefined,
      objectiveIds: selectedObjectiveIds.length > 0 ? selectedObjectiveIds : undefined,
    });
    onClose();
  };

  const toggleObjective = (id: string) => {
    setSelectedObjectiveIds((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id],
    );
  };

  return (
    <div className="bg-bg-primary/40 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md dark:bg-black/60">
      <div
        className="bg-bg-primary animate-in fade-in zoom-in-95 border-border-subtle fixed inset-x-0 bottom-0 w-full overflow-hidden rounded-t-[28px] border shadow-2xl duration-300 sm:relative sm:inset-auto sm:max-w-md sm:rounded-[24px] dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-border-subtle flex items-center justify-between border-b px-8 py-6 dark:border-[--dark-border-subtle]">
          <h2 className="text-xl font-bold">{habitToEdit ? 'Editar Hábito' : 'Nuevo Hábito'}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-accent bg-bg-secondary rounded-[12px] p-2 transition-colors dark:bg-[--dark-bg-secondary]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[82vh] space-y-6 overflow-y-auto p-6 sm:max-h-[70vh] sm:p-8">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="name"
                className="text-text-muted block text-xs font-bold tracking-widest uppercase"
              >
                Nombre del Hábito
              </label>
              {name.trim() && !habitToEdit && (
                <button
                  type="button"
                  onClick={suggestLocally}
                  disabled={isSuggesting}
                  className={cn(
                    'flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase transition-all',
                    isSuggesting ? 'text-accent animate-pulse' : 'text-accent/60 hover:text-accent',
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  {isSuggesting ? 'Sugiriendo...' : 'Sugerir'}
                </button>
              )}
            </div>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="iterum-input w-full text-lg font-semibold"
              placeholder="Ej. Meditar, Leer, Correr..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {HABIT_TYPES.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setType(item.type)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-[16px] border p-3 transition-all',
                  type === item.type
                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                    : 'bg-bg-secondary border-border-subtle text-text-muted opacity-60 hover:opacity-100 dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]',
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-bold tracking-wider uppercase">{item.label}</span>
              </button>
            ))}
          </div>

          {type !== 'yesno' && (
            <div className="animate-in fade-in slide-in-from-top-2 grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="target"
                  className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
                >
                  Objetivo
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
                  placeholder="Ej. min, km, pág"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="frequency"
              className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
            >
              Frecuencia
            </label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="iterum-input w-full appearance-none"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {objectives.length > 0 && (
            <div>
              <label className="text-text-muted mb-3 block text-xs font-bold tracking-widest uppercase">
                Contribuye a Objetivos
              </label>
              <div className="flex flex-wrap gap-2">
                {objectives.map((obj) => (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => toggleObjective(obj.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all',
                      selectedObjectiveIds.includes(obj.id)
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-bg-secondary border-border-subtle text-text-muted',
                    )}
                  >
                    {obj.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
              >
                Categoría
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="iterum-input w-full"
                placeholder="Salud, Foco..."
              />
            </div>
            <div>
              <label
                htmlFor="reminder"
                className="text-text-muted mb-2 block text-xs font-bold tracking-widest uppercase"
              >
                Recordatorio
              </label>
              <input
                id="reminder"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="iterum-input w-full [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-text-muted block text-xs font-bold tracking-widest uppercase">
                Color Distintivo
              </label>
              {appLevel < 2 && (
                <span className="text-accent flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
                  <Zap className="h-3 w-3" />
                  Nivel 2 Desbloquea más
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {COLORS.map((c, idx) => {
                const isLocked = appLevel < 2 && idx > 1;
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setColor(c)}
                    className={cn(
                      'relative h-7 w-7 rounded-full border-2 transition-all',
                      color === c
                        ? 'border-text-primary scale-125 shadow-lg'
                        : 'border-transparent hover:scale-110',
                      isLocked && 'cursor-not-allowed opacity-20 grayscale',
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="text-text-primary h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
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
                {habitToEdit ? 'Guardar Cambios' : 'Crear Hábito'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
