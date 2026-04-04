import { GoogleGenAI, Type } from "@google/genai";
import { Habit, HabitLog, Objective, WeeklyInsight } from "../types";
import { format, subDays } from "date-fns";

export class WeeklyInsightService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateWeeklyInsight(
    habits: Habit[],
    logs: HabitLog[],
    objectives: Objective[],
    reflections: { date: string; content: string }[]
  ): Promise<WeeklyInsight> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    });

    const relevantLogs = logs.filter(l => last7Days.includes(l.date));
    const relevantReflections = reflections.filter(r => last7Days.includes(r.date));

    const prompt = `
      Analiza los datos de productividad de la última semana para Junior.
      
      Hábitos: ${JSON.stringify(habits.map(h => ({ name: h.name, goal: h.targetValue, unit: h.unit })))}
      Logs de la semana: ${JSON.stringify(relevantLogs.map(l => ({ habitId: l.habitId, date: l.date, value: l.value, note: l.note })))}
      Objetivos actuales: ${JSON.stringify(objectives.map(o => ({ title: o.title, progress: Math.round((o.currentValue / o.targetValue) * 100) })))}
      Reflexiones del Journal: ${JSON.stringify(relevantReflections)}

      Tu tarea es:
      1. Resumir el progreso de la semana de forma motivadora pero realista.
      2. Identificar patrones (ej: "Eres más constante los martes", "Tu humor mejora cuando haces ejercicio").
      3. Dar 3 consejos accionables para la próxima semana.
      4. Crear una frase de "Sabiduría Semanal" personalizada.
      5. Calcular estadísticas básicas.

      Responde en formato JSON.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } },
              weeklyWisdom: { type: Type.STRING },
              stats: {
                type: Type.OBJECT,
                properties: {
                  completionRate: { type: Type.NUMBER },
                  mostConsistentHabit: { type: Type.STRING },
                  leastConsistentHabit: { type: Type.STRING }
                },
                required: ["completionRate", "mostConsistentHabit", "leastConsistentHabit"]
              }
            },
            required: ["summary", "patterns", "tips", "weeklyWisdom", "stats"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error: any) {
      const errorStr = String(error?.message || error);
      // Fallback if the API call fails (e.g., due to adblocker or network issue)
      if (errorStr.includes('xhr error') || errorStr.includes('fetch')) {
        console.warn('Weekly Insight network error (fallback applied):', errorStr);
        return {
          summary: "No se pudo generar el análisis detallado debido a un error de conexión, pero aquí tienes un resumen básico de tu semana.",
          patterns: [
            "Mantuviste actividad durante la semana.",
            "Registraste datos en tu diario o hábitos."
          ],
          tips: [
            "Revisa tus objetivos para la próxima semana.",
            "Intenta mantener la consistencia en tus hábitos principales.",
            "Tómate un descanso si lo necesitas."
          ],
          weeklyWisdom: "El progreso es progreso, sin importar cuán pequeño sea.",
          stats: {
            completionRate: 0.5,
            mostConsistentHabit: habits.length > 0 ? habits[0].name : "Ninguno",
            leastConsistentHabit: habits.length > 1 ? habits[1].name : "Ninguno"
          }
        };
      } else {
        console.error('Weekly Insight generation failed', error);
      }
      throw error;
    }
  }
}
