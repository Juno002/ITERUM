import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task, WeeklyInsight } from '../types';
import { cn } from '../utils';
import { Search, Tag, Calendar, BookOpen, ChevronRight } from 'lucide-react';

import { useJournalStore } from '../store/useJournalStore';
import { useObjectiveStore } from '../store/useObjectiveStore';

interface JournalViewProps {
  weeklyInsights?: WeeklyInsight[];
  onViewInsight?: (insight: WeeklyInsight) => void;
}

export function JournalView({
  weeklyInsights = [],
  onViewInsight,
}: JournalViewProps) {
  const { journals } = useJournalStore();
  const { objectives } = useObjectiveStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);

  const journalEntries = useMemo(() => {
    return [...journals].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [journals]);

  const allLinkedObjectives = useMemo(() => {
    const ids = new Set<string>();
    journalEntries.forEach((entry) => {
      if (entry.objectiveId) ids.add(entry.objectiveId);
    });
    return Array.from(ids)
      .map(id => objectives.find(o => o.id === id))
      .filter(Boolean) as import('../types').Objective[];
  }, [journalEntries, objectives]);

  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      const matchesSearch = entry.text?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
      const matchesObj = !selectedObjId || entry.objectiveId === selectedObjId;
      return matchesSearch && matchesObj;
    });
  }, [journalEntries, searchQuery, selectedObjId]);

  return (
    <div className="animate-in fade-in space-y-10 duration-700">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="relative max-w-md flex-1 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
          <Search className="text-text-muted absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Invocar esencias del pasado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="iterum-input w-full pl-12 bg-bg-secondary/50 backdrop-blur-sm relative border-border-subtle"
          />
        </div>

        <div className="no-scrollbar flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedObjId(null)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold tracking-widest whitespace-nowrap uppercase transition-all',
              !selectedObjId
                ? 'bg-accent/10 text-accent shadow-accent/20 border border-accent/20'
                : 'bg-bg-secondary text-text-muted hover:text-accent border border-transparent',
            )}
          >
            Todas
          </button>
          {allLinkedObjectives.map((obj) => (
            <button
              key={obj.id}
              onClick={() => setSelectedObjId(obj.id)}
              style={{
                borderColor: selectedObjId === obj.id ? obj.color_hint : 'transparent',
                backgroundColor: selectedObjId === obj.id ? `${obj.color_hint}15` : undefined,
                color: selectedObjId === obj.id ? obj.color_hint : undefined
              }}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-widest whitespace-nowrap uppercase transition-all',
                selectedObjId === obj.id
                  ? 'shadow-lg'
                  : 'bg-bg-secondary text-text-muted hover:opacity-80 border border-transparent',
              )}
            >
              <Tag className="h-3 w-3" />
              {obj.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8">
        {weeklyInsights.length > 0 && (
          <section className="space-y-6">
            <h3 className="text-accent flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase">
              <span className="bg-accent h-1.5 w-1.5 rounded-full"></span>
              Sabiduría Semanal
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {weeklyInsights.map((insight, idx) => (
                <div
                  key={idx}
                  onClick={() => onViewInsight?.(insight)}
                  className="bg-accent/5 border-accent/20 hover:bg-accent/10 group cursor-pointer rounded-[24px] border p-6 transition-all"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-accent flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
                      <BookOpen className="h-3 w-3" />
                      {insight.generatedAt
                        ? format(new Date(insight.generatedAt), 'dd MMM yyyy', { locale: es })
                        : 'Reciente'}
                    </div>
                    <ChevronRight className="text-accent h-4 w-4 opacity-0 transition-all group-hover:opacity-100" />
                  </div>
                  <p className="line-clamp-2 text-sm font-medium italic">
                    &quot;{insight.weeklyWisdom}&quot;
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <h3 className="text-text-muted flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase">
            <span className="bg-text-muted/30 h-1.5 w-1.5 rounded-full"></span>
            Entradas del Diario
          </h3>
          <div className="relative pl-6 space-y-12">
            {/* Timeline Line */}
            <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-border-subtle dark:bg-[--dark-border-subtle]"></div>

            {filteredEntries.map((entry) => {
              const linkedObj = entry.objectiveId ? objectives.find(o => o.id === entry.objectiveId) : null;
              const colorHint = linkedObj ? linkedObj.color_hint : '#555555';
              return (
                <article
                  key={entry.id}
                  className="relative group"
                >
                  {/* Timeline Node */}
                  <div 
                    className="absolute -left-[29px] top-2 w-[14px] h-[14px] rounded-full border-4 border-bg-primary dark:border-[--dark-bg-primary] shadow-sm transition-transform duration-500 group-hover:scale-150"
                    style={{ backgroundColor: colorHint }}
                  ></div>

                  <div 
                    style={{ '--hover-color': `${colorHint}20`, borderColor: 'var(--border-subtle)' } as React.CSSProperties}
                    className="bg-bg-primary border-border-subtle hover:border-transparent hover:!bg-[var(--hover-color)] rounded-[24px] border p-6 transition-all duration-500 hover:shadow-xl dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: colorHint }}>
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.created_at), "dd MMM yyyy '—' HH:mm", { locale: es })}
                        </div>
                        {linkedObj && (
                          <span 
                            className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-md"
                            style={{ backgroundColor: `${colorHint}15`, color: colorHint }}
                          >
                            @{linkedObj.title}
                          </span>
                        )}
                      </div>

                      <p className="text-sm md:text-base leading-relaxed italic text-text-primary dark:text-[--dark-text-primary] pr-4">
                        &quot;{entry.text || 'Contenido cifrado...'}&quot;
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-bg-secondary mb-6 flex h-20 w-20 items-center justify-center rounded-[32px]">
              <BookOpen className="text-text-muted h-10 w-10 opacity-20" />
            </div>
            <h3 className="mb-2 text-xl font-bold">No se encontraron reflexiones</h3>
            <p className="text-text-muted">Prueba con otros términos de búsqueda o etiquetas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
