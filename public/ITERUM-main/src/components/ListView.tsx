import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock, Edit2, Trash2 } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../utils';

interface ListViewProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function ListView({ tasks, onToggle, onDelete, onEdit }: ListViewProps) {
  const sortedTasks = [...tasks].sort((a, b) => a.date.getTime() - b.date.getTime());

  const groupedTasks = sortedTasks.reduce((acc, task) => {
    const dateKey = format(task.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No hay tareas</h3>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
          No se encontraron tareas. Comienza agregando una nueva o usa la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.entries(groupedTasks).map(([dateString, dayTasks]) => (
        <div key={dateString} className="space-y-6">
          <h2 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
            {getDateLabel(dateString)}
          </h2>
          
          <div className="space-y-3">
            {dayTasks.map((task) => (
              <div 
                key={task.id}
                className={cn(
                  "group flex items-center gap-5 p-5 iterum-card border-none hover:translate-x-1 transition-all",
                  task.completed && "opacity-50 grayscale-[0.5]"
                )}
              >
                <button 
                  onClick={() => onToggle(task.id)}
                  className="flex-shrink-0 transition-all duration-300"
                >
                  {task.completed ? (
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-bg-primary" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-border-subtle group-hover:border-accent transition-colors" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={cn(
                      "text-lg font-semibold truncate transition-all",
                      task.completed && "line-through text-text-muted"
                    )}>
                      {task.title}
                    </h3>
                    {task.type !== 'task' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                        {task.type}
                      </span>
                    )}
                    {task.migrated && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                        retrasado
                      </span>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className={cn(
                      "text-sm text-text-muted line-clamp-1",
                      task.completed && "line-through"
                    )}>
                      {task.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 text-xs font-medium text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {format(task.date, 'HH:mm')}
                  </div>
                  <div className="h-4 w-[1px] bg-border-subtle" />
                  <button 
                    onClick={() => onEdit(task)}
                    className="p-1.5 text-text-muted hover:text-accent transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(task.id)}
                    className="p-1.5 text-text-muted hover:text-accent-secondary transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
