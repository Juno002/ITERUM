import { useUserStore } from '../store/useUserStore';
import { DayClosure, Task, Habit, HabitLog, WeeklyInsight } from '../types';
import { GoogleGenAI } from "@google/genai";
import { format, addDays } from 'date-fns';

export function useDayClosure() {
  const { closedDays, setClosedDays, addClosedDay, weeklyInsights, setWeeklyInsights, addWeeklyInsight: addWeeklyInsightToStore } = useUserStore();

  const isDayClosed = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return closedDays.some(d => d.date === dateStr);
  };

  const calculateStreak = () => {
    let streak = 0;
    let current = new Date();
    
    // Check if today is closed or yesterday was closed to continue streak
    if (!isDayClosed(current)) {
      current = addDays(current, -1);
    }

    while (isDayClosed(current)) {
      streak++;
      current = addDays(current, -1);
    }
    return streak;
  };

  const generateAISummary = async (habits: Habit[], logs: HabitLog[], tasks: Task[]) => {
    if (!navigator.onLine) return "Día completado. (Resumen IA no disponible offline)";
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "No se pudo generar el resumen (falta API Key).";

    const ai = new GoogleGenAI({ apiKey });
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const todayLogs = logs.filter(l => l.date === todayStr);
    const todayTasks = tasks.filter(t => format(t.date, 'yyyy-MM-dd') === todayStr);

    const completedHabits = habits.filter(h => todayLogs.find(l => l.habitId === h.id && l.completed));
    const missedHabits = habits.filter(h => !todayLogs.find(l => l.habitId === h.id && l.completed));
    const completedTasks = todayTasks.filter(t => t.completed);
    const missedTasks = todayTasks.filter(t => !t.completed);

    const prompt = `
      Analiza los hábitos y tareas del usuario hoy (${todayStr}):
      Hábitos completados: ${completedHabits.map(h => h.name).join(', ') || 'Ninguno'}
      Hábitos fallados: ${missedHabits.map(h => h.name).join(', ') || 'Ninguno'}
      Tareas completadas: ${completedTasks.map(t => t.title).join(', ') || 'Ninguna'}
      Tareas pendientes: ${missedTasks.map(t => t.title).join(', ') || 'Ninguna'}

      Identifica patrones negativos si los hay.
      Sugiere 1 ajuste concreto y breve (máx 20 palabras), positivo y accionable.
      Formato: Un párrafo corto y motivador seguido del ajuste sugerido.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text || "Día completado. ¡Sigue así!";
    } catch (e: any) {
      const errorStr = String(e?.message || e);
      if (errorStr.includes('xhr error') || errorStr.includes('fetch')) {
        console.warn('AI Summary network error (fallback applied):', errorStr);
        return "Día completado. (Resumen automático por error de conexión)";
      } else {
        console.error('AI Summary failed', e);
      }
      return "Día completado. No se pudo generar el resumen inteligente.";
    }
  };

  const closeDay = async (
    date: Date, 
    habits: Habit[], 
    logs: HabitLog[], 
    tasks: Task[],
    updateTask: (id: string, updates: Partial<Task>) => void,
    addTask: (task: Omit<Task, 'id' | 'completed'>) => void
  ) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (isDayClosed(date)) return null;

    const summary = await generateAISummary(habits, logs, tasks);
    
    // 1. Migrate uncompleted tasks
    const todayTasks = tasks.filter(t => format(t.date, 'yyyy-MM-dd') === dateStr && !t.completed);
    todayTasks.forEach(t => {
      updateTask(t.id, { 
        date: addDays(t.date, 1),
        migrated: true 
      });
    });

    // 2. Handle uncompleted habits (create tasks for tomorrow)
    const todayLogs = logs.filter(l => l.date === dateStr);
    const missedHabits = habits.filter(h => !todayLogs.find(l => l.habitId === h.id && l.completed));
    // Optional: only migrate if they were active today
    // For now, let's just migrate all missed ones that should have occurred
    // (This is a bit complex since we don't have the "should occur" logic here easily, 
    // but we can assume if they are in the "Today" view they should have occurred)
    
    // 3. Mark day as closed
    const newClosure: DayClosure = {
      date: dateStr,
      summary,
      closedAt: new Date(),
    };

    setClosedDays([...closedDays, newClosure]);
    return newClosure;
  };

  const addWeeklyInsight = (insight: WeeklyInsight) => {
    const newInsight = { ...insight, generatedAt: new Date() };
    addWeeklyInsightToStore(newInsight);
  };

  return { 
    closedDays, 
    isDayClosed, 
    closeDay, 
    calculateStreak, 
    setClosedDays, 
    weeklyInsights, 
    addWeeklyInsight,
    setWeeklyInsights 
  };
}
