import { useState, FormEvent } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task } from '../types';
import { suggestTasks } from '../services/geminiService';
import { cn } from '../utils';

interface AISuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (tasks: Omit<Task, 'id' | 'completed'>[]) => void;
}

export function AISuggestionModal({ isOpen, onClose, onApply }: AISuggestionModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<Omit<Task, 'id' | 'completed'>[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleSuggest = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setSuggestedTasks([]);
    setSelectedIndices(new Set());
    
    try {
      const tasks = await suggestTasks(prompt);
      setSuggestedTasks(tasks);
      setSelectedIndices(new Set(tasks.map((_, i) => i)));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  const handleApply = () => {
    const tasksToApply = suggestedTasks.filter((_, i) => selectedIndices.has(i));
    onApply(tasksToApply);
    
    setTimeout(() => {
      setPrompt('');
      setSuggestedTasks([]);
      setSelectedIndices(new Set());
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/40 dark:bg-black/60 backdrop-blur-md">
      <div 
        className="bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-border-subtle dark:border-[--dark-border-subtle]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-border-subtle dark:border-[--dark-border-subtle] bg-accent/5">
          <div className="flex items-center gap-3 text-accent">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">Asistente Contextual</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-accent bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[12px] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto">
          {!navigator.onLine ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center px-8">
              <div className="w-16 h-16 bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-full flex items-center justify-center border border-border-subtle dark:border-[--dark-border-subtle]">
                <Zap className="w-8 h-8 text-text-muted opacity-40" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Modo Offline</h3>
                <p className="text-text-muted text-sm max-w-xs mx-auto">
                  Las funciones de IA requieren conexión a internet. Vuelve cuando estés en línea para usar el asistente.
                </p>
              </div>
            </div>
          ) : !suggestedTasks.length && !isLoading ? (
            <form onSubmit={handleSuggest} className="space-y-6">
              <div>
                <label htmlFor="prompt" className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
                  ¿En qué estás trabajando?
                </label>
                <textarea
                  id="prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="iterum-input w-full text-lg resize-none"
                  placeholder="Ej. Planea mi semana para el lanzamiento de Iterum, necesito foco en desarrollo y marketing..."
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="iterum-button-primary w-full flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                Generar Sugerencias
              </button>
            </form>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-accent animate-pulse" />
              </div>
              <p className="text-text-muted font-bold uppercase tracking-widest text-xs animate-pulse">Analizando contexto...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Sugerencias Contextuales</h3>
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                  {selectedIndices.size} SELECCIONADAS
                </span>
              </div>
              
              <div className="space-y-4">
                {suggestedTasks.map((task, index) => {
                  const isSelected = selectedIndices.has(index);
                  return (
                    <div 
                      key={index}
                      onClick={() => toggleSelection(index)}
                      className={cn(
                        "p-6 rounded-[20px] border transition-all cursor-pointer flex gap-5",
                        isSelected 
                          ? "bg-accent/5 border-accent shadow-lg shadow-accent/5" 
                          : "bg-bg-secondary dark:bg-[--dark-bg-secondary] border-border-subtle dark:border-[--dark-border-subtle] opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className={cn(
                        "mt-1 flex-shrink-0 transition-colors",
                        isSelected ? "text-accent" : "text-text-muted"
                      )}>
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-bold truncate">
                            {task.title}
                          </h4>
                          {task.color && (
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: task.color }}
                            />
                          )}
                        </div>
                        <p className="text-sm text-text-muted mb-4 line-clamp-2">
                          {task.description}
                        </p>
                        <div className="text-[10px] font-bold text-accent bg-accent/10 inline-flex px-3 py-1 rounded-full border border-accent/20 uppercase tracking-wider">
                          {format(task.date, "EEEE, d MMM 'a las' HH:mm", { locale: es })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {suggestedTasks.length > 0 && !isLoading && (
          <div className="p-6 border-t border-border-subtle dark:border-[--dark-border-subtle] bg-bg-secondary/50 dark:bg-black/20 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setSuggestedTasks([]);
                setPrompt('');
              }}
              className="px-6 py-3 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={selectedIndices.size === 0}
              className="iterum-button-primary"
            >
              Integrar {selectedIndices.size} sugerencias
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
