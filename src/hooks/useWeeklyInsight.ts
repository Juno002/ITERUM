import { useState } from 'react';
import { format } from 'date-fns';
import { WeeklyInsightService } from '../services/WeeklyInsightService';
import { useHabitStore } from '../store/useHabitStore';
import { useObjectiveStore } from '../store/useObjectiveStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUserStore } from '../store/useUserStore';
import { useUIStore } from '../store/useUIStore';
import { WeeklyInsight } from '../types';

export function useWeeklyInsight() {
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  
  const { habits, logs } = useHabitStore();
  const { objectives } = useObjectiveStore();
  const { tasks } = useTaskStore();
  const { addWeeklyInsight } = useUserStore();
  const { setToast } = useUIStore();

  const generateWeeklyInsight = async () => {
    if (!navigator.onLine) {
      setToast({
        isOpen: true,
        title: 'Modo Offline',
        message: 'El análisis semanal requiere conexión a internet.'
      });
      return;
    }
    setIsGeneratingInsight(true);
    try {
      const service = new WeeklyInsightService(process.env.GEMINI_API_KEY || '');
      const journalReflections = tasks
        .filter(t => t.type === 'journal' && t.content)
        .map(t => ({ date: format(t.date, 'yyyy-MM-dd'), content: t.content || '' }));
      
      const insight = await service.generateWeeklyInsight(habits, logs, objectives, journalReflections);
      addWeeklyInsight(insight);
      setWeeklyInsight(insight);
      setIsWeeklyReviewOpen(true);
    } catch (error) {
      console.error('Failed to generate weekly insight', error);
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo generar el análisis semanal. Inténtalo de nuevo.'
      });
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  return {
    isGeneratingInsight,
    weeklyInsight,
    setWeeklyInsight,
    isWeeklyReviewOpen,
    setIsWeeklyReviewOpen,
    generateWeeklyInsight
  };
}
