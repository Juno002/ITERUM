import React, { useState, useEffect, FormEvent } from 'react';
import { X, Zap, Target, BookOpen, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { Task, EntityType } from '../types';
import { cn } from '../utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'completed'>) => void;
  initialDate?: Date;
  taskToEdit?: Task;
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

const ENTITY_TYPES: { type: EntityType; label: string; icon: any }[] = [
  { type: 'task', label: 'Tarea', icon: Zap },
  { type: 'habit', label: 'Hábito', icon: Repeat },
  { type: 'objective', label: 'Objetivo', icon: Target },
  { type: 'journal', label: 'Nota', icon: BookOpen },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Cada día' },
  { value: 'weekly:Mon,Wed,Fri', label: 'Lun, Mié, Vie' },
  { value: 'weekly:Sat,Sun', label: 'Fines de semana' },
];

export function TaskModal({ isOpen, onClose, onSave, initialDate = new Date(), taskToEdit }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<EntityType>('task');

  // Habit specific
  const [habitFrequency, setHabitFrequency] = useState('daily');
  const [habitType, setHabitType] = useState<'yesno' | 'numeric'>('yesno');
  const [habitTarget, setHabitTarget] = useState(1);
  const [habitUnit, setHabitUnit] = useState('');

  // Objective specific
  const [objTarget, setObjTarget] = useState(100);
  const [objUnit, setObjUnit] = useState('%');
  const [objDeadline, setObjDeadline] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setDateStr(format(taskToEdit.date, 'yyyy-MM-dd'));
        setTimeStr(format(taskToEdit.date, 'HH:mm'));
        setColor(taskToEdit.color || COLORS[0]);
        setType(taskToEdit.type || 'task');
      } else {
        setDateStr(format(initialDate, 'yyyy-MM-dd'));
        setTimeStr(format(initialDate, 'HH:mm'));
        setTitle('');
        setDescription('');
        setColor(COLORS[0]);
        setType('task');
        setHabitFrequency('daily');
        setHabitType('yesno');
        setHabitTarget(1);
        setHabitUnit('');
        setObjTarget(100);
        setObjUnit('%');
        setObjDeadline('');
      }
    }
  }, [isOpen, initialDate, taskToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const combinedDate = dateStr && timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date();

    onSave({
      title: title.trim(),
      description: description.trim(),
      date: combinedDate,
      color,
      type,
      // Pass extra data for App.tsx to handle
      ...(type === 'habit' && {
        habitData: {
          frequency: habitFrequency,
          type: habitType,
          targetValue: habitTarget,
          unit: habitUnit
        }
      }),
      ...(type === 'objective' && {
        objectiveData: {
          targetValue: objTarget,
          unit: objUnit,
          deadline: objDeadline ? new Date(objDeadline) : undefined
        }
      })
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/40 dark:bg-black/60 backdrop-blur-md">
      <div 
        className="bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-border-subtle dark:border-[--dark-border-subtle]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-border-subtle dark:border-[--dark-border-subtle]">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-[14px] flex items-center justify-center">
              {ENTITY_TYPES.find(t => t.type === type)?.icon && (
                React.createElement(ENTITY_TYPES.find(t => t.type === type)!.icon, { className: "w-5 h-5 text-accent" })
              )}
            </div>
            {taskToEdit ? 'Editar' : 'Capturar'} {ENTITY_TYPES.find(t => t.type === type)?.label}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-accent bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[12px] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto iterum-scrollbar">
          {/* Entity Type Selector */}
          <div className="grid grid-cols-4 gap-2">
            {ENTITY_TYPES.map((item) => (
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

          <div>
            <label htmlFor="title" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              {type === 'habit' ? 'Nombre del Hábito' : type === 'objective' ? 'Título del Objetivo' : type === 'journal' ? 'Título de la Nota' : 'Título'}
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="iterum-input w-full text-lg font-semibold"
              placeholder={type === 'habit' ? 'Ej. Meditar, Correr...' : type === 'objective' ? 'Ej. Maratón 2026' : '¿Qué tienes en mente?'}
              autoFocus
            />
          </div>

          {type === 'habit' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Tipo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHabitType('yesno')}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        habitType === 'yesno' ? "bg-accent text-bg-primary border-accent" : "bg-bg-secondary border-border-subtle text-text-muted"
                      )}
                    >
                      Sí/No
                    </button>
                    <button
                      type="button"
                      onClick={() => setHabitType('numeric')}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        habitType === 'numeric' ? "bg-accent text-bg-primary border-accent" : "bg-bg-secondary border-border-subtle text-text-muted"
                      )}
                    >
                      Número
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Frecuencia</label>
                  <select
                    value={habitFrequency}
                    onChange={(e) => setHabitFrequency(e.target.value)}
                    className="iterum-input w-full text-xs"
                  >
                    {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>

              {habitType === 'numeric' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Meta</label>
                    <input
                      type="number"
                      value={habitTarget}
                      onChange={(e) => setHabitTarget(Number(e.target.value))}
                      className="iterum-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Unidad</label>
                    <input
                      type="text"
                      value={habitUnit}
                      onChange={(e) => setHabitUnit(e.target.value)}
                      className="iterum-input w-full"
                      placeholder="km, pág..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'objective' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Meta</label>
                  <input
                    type="number"
                    value={objTarget}
                    onChange={(e) => setObjTarget(Number(e.target.value))}
                    className="iterum-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Unidad</label>
                  <input
                    type="text"
                    value={objUnit}
                    onChange={(e) => setObjUnit(e.target.value)}
                    className="iterum-input w-full"
                    placeholder="%, km..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Fecha Límite</label>
                <input
                  type="date"
                  value={objDeadline}
                  onChange={(e) => setObjDeadline(e.target.value)}
                  className="iterum-input w-full"
                />
              </div>
            </div>
          )}

          {type !== 'objective' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                  Fecha
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="iterum-input w-full [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                  Hora
                </label>
                <input
                  id="time"
                  type="time"
                  required
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="iterum-input w-full [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              {type === 'journal' ? 'Contenido de la Nota' : 'Descripción'}
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="iterum-input w-full resize-none"
              placeholder={type === 'journal' ? 'Escribe tus pensamientos...' : 'Añade contexto o detalles...'}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
              Color
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
              {taskToEdit ? 'Guardar Cambios' : 'Capturar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
