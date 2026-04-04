import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task, WeeklyInsight } from '../types';
import { cn } from '../utils';
import { Search, Tag, Calendar, BookOpen, ChevronRight, Sparkles } from 'lucide-react';

interface JournalViewProps {
  tasks: Task[];
  weeklyInsights?: WeeklyInsight[];
  onEdit: (task: Task) => void;
  onViewInsight?: (insight: WeeklyInsight) => void;
}

export function JournalView({ tasks, weeklyInsights = [], onEdit, onViewInsight }: JournalViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const journalEntries = useMemo(() => {
    return tasks
      .filter(t => t.type === 'journal')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    journalEntries.forEach(entry => {
      entry.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [journalEntries]);

  const filteredEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           entry.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || entry.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [journalEntries, searchQuery, selectedTag]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar en tus reflexiones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="iterum-input pl-12 w-full"
          />
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedTag(null)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              !selectedTag ? "bg-accent text-bg-primary shadow-lg shadow-accent/20" : "bg-bg-secondary text-text-muted hover:text-accent"
            )}
          >
            Todos
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                selectedTag === tag ? "bg-accent text-bg-primary shadow-lg shadow-accent/20" : "bg-bg-secondary text-text-muted hover:text-accent"
              )}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8">
        {weeklyInsights.length > 0 && (
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              Sabiduría Semanal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyInsights.map((insight, idx) => (
                <div 
                  key={idx}
                  onClick={() => onViewInsight?.(insight)}
                  className="p-6 bg-accent/5 border border-accent/20 rounded-[24px] cursor-pointer hover:bg-accent/10 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" />
                      {insight.generatedAt ? format(new Date(insight.generatedAt), 'dd MMM yyyy', { locale: es }) : 'Reciente'}
                    </div>
                    <ChevronRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                  <p className="text-sm font-medium italic line-clamp-2">"{insight.weeklyWisdom}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted/30"></span>
            Entradas del Diario
          </h3>
          <div className="grid gap-8">
            {filteredEntries.map((entry) => (
              <article 
                key={entry.id}
                onClick={() => onEdit(entry)}
                className="group cursor-pointer bg-bg-primary dark:bg-[--dark-bg-primary] border border-border-subtle dark:border-[--dark-border-subtle] rounded-[32px] p-8 hover:border-accent/40 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-48 flex-shrink-0">
                    <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(entry.date), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <h3 className="text-xl font-bold leading-tight group-hover:text-accent transition-colors">
                      {entry.title}
                    </h3>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <p className="text-text-muted dark:text-[--dark-text-muted] leading-relaxed line-clamp-3 italic">
                      "{entry.content || 'Sin contenido...'}"
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border-subtle dark:border-[--dark-border-subtle]">
                      <div className="flex gap-2">
                        {entry.tags?.map(tag => (
                          <span key={tag} className="text-[9px] font-bold uppercase tracking-widest text-accent/60 bg-accent/5 px-2 py-1 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        Leer más
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-bg-secondary rounded-[32px] flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-text-muted opacity-20" />
            </div>
            <h3 className="text-xl font-bold mb-2">No se encontraron reflexiones</h3>
            <p className="text-text-muted">Prueba con otros términos de búsqueda o etiquetas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
