import { useState, useEffect, FormEvent } from 'react';
import { X, Zap, Repeat, Target, Clock, BookOpen, Sparkles } from 'lucide-react';
import { Habit, HabitType } from '../types';
import { cn } from '../utils';
import { GoogleGenAI } from "@google/genai";
import { useObjectiveStore } from '../store/useObjectiveStore';
import { useUserStore } from '../store/useUserStore';

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

const HABIT_TYPES: { type: HabitType; label: string; icon: any }[] = [
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

export function HabitModal({ isOpen, onClose, onSave, habitToEdit }: HabitModalProps) {
  const objectives = useObjectiveStore(state => state.objectives);
  const userLevel = useUserStore(state => state.stats.level);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [type, setType] = useState<HabitType>('yesno');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [reminderTime, setReminderTime] = useState('');
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const suggestWithAI = async () => {
    if (!name.trim() || !navigator.onLine) return;
    setIsSuggesting(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setIsSuggesting(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sugiere configuración para un hábito llamado "${name}". 
        Responde SOLO en JSON con este formato: 
        { "frequency": "daily" | "weekly:Mon,Wed,Fri" | "everyXdays:2", "category": "string", "description": "string", "type": "yesno" | "numeric" | "timer", "unit": "string", "targetValue": number }`,
        config: { responseMimeType: "application/json" }
      });

      const suggestion = JSON.parse(response.text || '{}');
      if (suggestion.frequency) setFrequency(suggestion.frequency);
      if (suggestion.category) setCategory(suggestion.category);
      if (suggestion.description) setDescription(suggestion.description);
      if (suggestion.type) setType(suggestion.type);
      if (suggestion.unit) setUnit(suggestion.unit);
      if (suggestion.targetValue) setTargetValue(suggestion.targetValue);
    } catch (error: any) {
      // Fallback for network/adblocker errors
      const errorStr = String(error?.message || error);
      if (errorStr.includes('xhr error') || errorStr.includes('fetch')) {
        console.warn('AI Suggestion network error (fallback applied):', errorStr);
        setFrequency('daily');
        setType('yesno');
        setDescription('Un buen hábito para empezar.');
      } else {
        console.error('AI Suggestion failed', error);
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setDescription(habitToEdit.description || '');
        setFrequency(habitToEdit.frequency);
        setType(habitToEdit.type);
        setTargetValue(habitToEdit.targetValue || 1);
        setUnit(habitToEdit.unit || '');
        setCategory(habitToEdit.category || '');
        setColor(habitToEdit.color || COLORS[0]);
        setReminderTime(habitToEdit.reminderTime || '');
        setSelectedObjectiveIds(habitToEdit.objectiveIds || []);
      } else {
        setName('');
        setDescription('');
        setFrequency('daily');
        setType('yesno');
        setTargetValue(1);
        setUnit('');
        setCategory('');
        setColor(COLORS[0]);
        setReminderTime('');
        setSelectedObjectiveIds([]);
      }
    }
  }, [isOpen, habitToEdit]);

  if (!isOpen) return null;

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
    setSelectedObjectiveIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/40 dark:bg-black/60 backdrop-blur-md">
      <div 
        className="bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-border-subtle dark:border-[--dark-border-subtle]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-border-subtle dark:border-[--dark-border-subtle]">
          <h2 className="text-xl font-bold">
            {habitToEdit ? 'Editar Hábito' : 'Nuevo Hábito'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-accent bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[12px] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-text-muted">
                Nombre del Hábito
              </label>
              {name.trim() && !habitToEdit && navigator.onLine && (
                <button
                  type="button"
                  onClick={suggestWithAI}
                  disabled={isSuggesting}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all",
                    isSuggesting ? "text-accent animate-pulse" : "text-accent/60 hover:text-accent"
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  {isSuggesting ? 'Sugiriendo...' : 'Sugerir con IA'}
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
                  "flex flex-col items-center gap-2 p-3 rounded-[16px] border transition-all",
                  type === item.type 
                    ? "bg-accent/10 border-accent text-accent shadow-sm" 
                    : "bg-bg-secondary dark:bg-[--dark-bg-secondary] border-border-subtle dark:border-[--dark-border-subtle] text-text-muted opacity-60 hover:opacity-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </div>

          {type !== 'yesno' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label htmlFor="target" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
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
                  placeholder="Ej. min, km, pág"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="frequency" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              Frecuencia
            </label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="iterum-input w-full appearance-none"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {objectives.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
                Contribuye a Objetivos
              </label>
              <div className="flex flex-wrap gap-2">
                {objectives.map((obj) => (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => toggleObjective(obj.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                      selectedObjectiveIds.includes(obj.id)
                        ? "bg-accent/10 border-accent text-accent"
                        : "bg-bg-secondary border-border-subtle text-text-muted"
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
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
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
              <label htmlFor="reminder" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
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
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted">
                Color Distintivo
              </label>
              {userLevel < 2 && (
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Nivel 2 Desbloquea más
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {COLORS.map((c, idx) => {
                const isLocked = userLevel < 2 && idx > 1;
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all border-2 relative",
                      color === c ? "scale-125 border-text-primary shadow-lg" : "border-transparent hover:scale-110",
                      isLocked && "opacity-20 cursor-not-allowed grayscale"
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
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
              {habitToEdit ? 'Guardar Cambios' : 'Crear Hábito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
