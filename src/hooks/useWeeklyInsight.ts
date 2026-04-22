import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { useHabitStore } from '../store/useHabitStore';
import { useObjectiveStore } from '../store/useObjectiveStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStatsStore } from '../store/useAppStatsStore';
import { WeeklyInsight } from '../types';

export function useWeeklyInsight() {
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);

  const { habits, logs } = useHabitStore();
  const { objectives } = useObjectiveStore();
  const { tasks } = useTaskStore();
  const { addWeeklyInsight } = useAppStatsStore();

  const generateWeeklyInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      const weekDates = Array.from({ length: 7 }, (_, index) =>
        format(subDays(new Date(), 6 - index), 'yyyy-MM-dd'),
      );
      const weeklyLogs = logs.filter((log) => weekDates.includes(log.date));
      const completedLogs = weeklyLogs.filter((log) => log.completed);
      const expectedChecks = Math.max(1, habits.filter((habit) => habit.isActive).length * 7);
      const completionRate = Math.round((completedLogs.length / expectedChecks) * 100);
      const habitScores = habits.map((habit) => ({
        habit,
        count: completedLogs.filter((log) => log.habitId === habit.id).length,
      }));
      const mostConsistentHabit =
        [...habitScores].sort((a, b) => b.count - a.count)[0]?.habit.name ?? 'Sin datos';
      const leastConsistentHabit =
        [...habitScores].sort((a, b) => a.count - b.count)[0]?.habit.name ?? 'Sin datos';
      const completedTasks = tasks.filter((task) => task.completed).length;
      const activeObjectives = objectives.filter((objective) => objective.status === 'active').length;

      const insight: WeeklyInsight = {
        summary: `Completaste ${completionRate}% de tus hábitos esperados y cerraste ${completedTasks} tareas.`,
        patterns: [
          completedLogs.length > 0
            ? `${mostConsistentHabit} fue tu hábito con más presencia esta semana.`
            : 'Aún no hay suficientes registros para detectar una tendencia fuerte.',
          activeObjectives > 0
            ? `Mantienes ${activeObjectives} objetivos activos conectados a tu sistema diario.`
            : 'Todavía puedes definir una meta clara para orientar tus hábitos.',
        ],
        tips: [
          completionRate < 50
            ? 'Reduce la fricción: deja un hábito tan pequeño que sea difícil fallarlo.'
            : 'Mantén el ritmo y evita agregar demasiados hábitos nuevos a la vez.',
          leastConsistentHabit !== 'Sin datos'
            ? `Revisa si "${leastConsistentHabit}" necesita una hora o disparador más claro.`
            : 'Empieza registrando al menos un hábito durante tres días seguidos.',
        ],
        weeklyWisdom:
          completionRate >= 70
            ? 'La consistencia no se siente heroica; se siente repetible.'
            : 'Un sistema sólido empieza por volver al siguiente paso, no por castigarse por el anterior.',
        stats: {
          completionRate,
          mostConsistentHabit,
          leastConsistentHabit,
        },
        generatedAt: new Date(),
      };
      addWeeklyInsight(insight);
      setWeeklyInsight(insight);
      setIsWeeklyReviewOpen(true);
    } catch (error) {
      console.error('Failed to generate weekly insight', error);
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
    generateWeeklyInsight,
  };
}
