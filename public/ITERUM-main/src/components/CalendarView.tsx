import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../utils';

interface CalendarViewProps {
  tasks: Task[];
  onDateSelect: (date: Date) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function CalendarView({ tasks, onDateSelect, onToggle, onEdit }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, "d");
      const cloneDay = day;
      const dayTasks = tasks.filter(task => isSameDay(task.date, cloneDay));

      days.push(
        <div
          key={day.toString()}
          onClick={() => onDateSelect(cloneDay)}
          className={cn(
            "min-h-[120px] p-2 border-r border-b border-zinc-200 dark:border-zinc-800 relative group cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
            !isSameMonth(day, monthStart) ? "bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600" : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
            isToday(day) && "bg-indigo-50/30 dark:bg-indigo-500/5"
          )}
        >
          <div className="flex justify-between items-start">
            <span className={cn(
              "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
              isToday(day) ? "bg-indigo-600 text-white" : ""
            )}>
              {formattedDate}
            </span>
            <button className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-opacity">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
            {dayTasks.slice(0, 3).map(task => (
              <div 
                key={task.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className={cn(
                  "text-xs px-1.5 py-1 rounded-md truncate transition-all",
                  task.completed 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 line-through" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
                style={!task.completed && task.color ? { borderLeft: `3px solid ${task.color}` } : {}}
              >
                {format(task.date, 'HH:mm')} {task.title}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium px-1">
                +{dayTasks.length - 3} más
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
  }

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="iterum-card p-0 overflow-hidden border-none shadow-xl shadow-accent/5">
      <div className="flex items-center justify-between px-8 py-6 border-b border-border-subtle dark:border-[--dark-border-subtle]">
        <h2 className="text-2xl font-bold text-text-primary dark:text-[--dark-text-primary] capitalize">
          {format(currentDate, dateFormat, { locale: es })}
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={prevMonth}
            className="p-2.5 hover:bg-bg-primary dark:hover:bg-[--dark-bg-primary] rounded-[12px] transition-colors text-text-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-bold text-accent hover:bg-accent/10 rounded-[12px] transition-colors"
          >
            Hoy
          </button>
          <button 
            onClick={nextMonth}
            className="p-2.5 hover:bg-bg-primary dark:hover:bg-[--dark-bg-primary] rounded-[12px] transition-colors text-text-muted"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-bg-primary/30 dark:bg-[--dark-bg-primary]/30">
        {weekDays.map(day => (
          <div key={day} className="py-4 text-center text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days}
      </div>
    </div>
  );
}
