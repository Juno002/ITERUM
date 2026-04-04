import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, TrendingUp, Brain, Zap } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Habit, HabitLog, Task } from '../types';
import { format, subDays } from 'date-fns';

interface AIInsightBannerProps {
  habits: Habit[];
  logs: HabitLog[];
  tasks: Task[];
}

export const AIInsightBanner: React.FC<AIInsightBannerProps> = ({ habits, logs, tasks }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const lastInsightTime = localStorage.getItem('iterum_last_insight_time');
    const now = new Date().getTime();
    
    // Only generate once every 12 hours to avoid spam and cost
    if (!lastInsightTime || now - parseInt(lastInsightTime) > 12 * 60 * 60 * 1000) {
      generateInsight();
    } else {
      const savedInsight = localStorage.getItem('iterum_current_insight');
      if (savedInsight) {
        setInsight(savedInsight);
        setIsVisible(true);
      }
    }
  }, []);

  const generateInsight = async () => {
    setIsLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('No API key found for AI Insight');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const last3Days = Array.from({ length: 3 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
      const recentLogs = logs.filter(l => last3Days.includes(l.date));
      const recentJournal = tasks
        .filter(t => t.type === 'journal' && last3Days.includes(format(t.date, 'yyyy-MM-dd')))
        .map(t => t.content);

      const prompt = `
        Eres el mentor de productividad de Junior. Analiza sus últimos 3 días:
        Hábitos: ${JSON.stringify(habits.map(h => h.name))}
        Logs: ${JSON.stringify(recentLogs.map(l => ({ h: l.habitId, d: l.date, v: l.value })))}
        Journal: ${JSON.stringify(recentJournal)}

        Da un consejo MUY breve (máximo 15 palabras) y accionable para HOY. 
        Enfócate en patrones o motivación. Sé cálido y profesional.
        No uses introducciones como "Aquí tienes tu consejo". Ve directo al grano.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text?.trim() || null;
      if (text) {
        setInsight(text);
        setIsVisible(true);
        localStorage.setItem('iterum_current_insight', text);
        localStorage.setItem('iterum_last_insight_time', new Date().getTime().toString());
      }
    } catch (error: any) {
      const errorStr = String(error?.message || error);
      // If it's a network/adblocker error, provide a fallback insight so the user still gets value
      if (errorStr.includes('xhr error') || errorStr.includes('fetch')) {
        console.warn('AI Insight network error (fallback applied):', errorStr);
        const fallbackInsights = [
          "La consistencia vence a la intensidad. Enfócate en un hábito hoy.",
          "Un pequeño paso hoy es mejor que un gran salto mañana.",
          "Revisa tus objetivos y ajusta tu rumbo si es necesario.",
          "Tómate 5 minutos para planificar tu día. Marcará la diferencia."
        ];
        const randomInsight = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)];
        setInsight(randomInsight);
        setIsVisible(true);
      } else {
        console.error('AI Insight failed', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible || !insight) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative overflow-hidden bg-bg-secondary dark:bg-[--dark-bg-secondary] border border-accent/20 rounded-[24px] p-5 shadow-sm group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Brain className="w-12 h-12 text-accent" />
        </div>
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 bg-accent/10 rounded-[14px] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Sugerencia del Mentor</span>
              <div className="w-1 h-1 rounded-full bg-accent/30" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Hoy</span>
            </div>
            <p className="text-sm font-medium text-text-primary dark:text-[--dark-text-primary] leading-relaxed">
              {insight}
            </p>
          </div>

          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 text-text-muted hover:text-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      </motion.div>
    </AnimatePresence>
  );
};
