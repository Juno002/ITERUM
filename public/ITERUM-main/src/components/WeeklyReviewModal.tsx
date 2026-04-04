import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, TrendingUp, Lightbulb, Quote, CheckCircle2 } from 'lucide-react';
import { WeeklyInsight } from '../types';
import { cn } from '../utils';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: WeeklyInsight;
  dailyStats: { day: string; rate: number }[];
}

export function WeeklyReviewModal({ isOpen, onClose, insight, dailyStats }: WeeklyReviewModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-bg-primary/60 dark:bg-[--dark-bg-primary]/60 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[32px] border border-border-subtle dark:border-[--dark-border-subtle] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-border-subtle dark:border-[--dark-border-subtle] flex items-center justify-between bg-gradient-to-r from-accent/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent rounded-[20px] flex items-center justify-center shadow-lg shadow-accent/20">
                <Sparkles className="w-7 h-7 text-bg-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Sabiduría Semanal</h2>
                <p className="text-text-muted dark:text-[--dark-text-muted] font-medium">Tu evolución en los últimos 7 días</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-text-muted hover:text-accent bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[16px] border border-border-subtle dark:border-[--dark-border-subtle] transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] border border-border-subtle dark:border-[--dark-border-subtle]">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Consistencia</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-accent">{Math.round(insight.stats.completionRate * 100)}%</span>
                  <span className="text-sm text-text-muted mb-1">promedio</span>
                </div>
              </div>
              <div className="p-6 bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] border border-border-subtle dark:border-[--dark-border-subtle]">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Hábito Estrella</p>
                <p className="text-xl font-bold truncate">{insight.stats.mostConsistentHabit}</p>
                <p className="text-xs text-emerald-500 font-bold mt-1">¡Sigue así!</p>
              </div>
              <div className="p-6 bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] border border-border-subtle dark:border-[--dark-border-subtle]">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Oportunidad</p>
                <p className="text-xl font-bold truncate">{insight.stats.leastConsistentHabit}</p>
                <p className="text-xs text-amber-500 font-bold mt-1">Necesita un empujón</p>
              </div>
            </div>

            {/* Chart */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Actividad Diaria
              </h3>
              <div className="h-64 w-full bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] p-6 border border-border-subtle dark:border-[--dark-border-subtle]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis hide domain={[0, 1]} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Completado']}
                    />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                      {dailyStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rate > 0.7 ? '#C9935A' : '#A0522D'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Quote className="w-5 h-5 text-accent" />
                    Resumen de la IA
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-text-muted dark:text-[--dark-text-muted] leading-relaxed">
                    <ReactMarkdown>{insight.summary}</ReactMarkdown>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Patrones Detectados
                  </h3>
                  <div className="space-y-3">
                    {insight.patterns.map((pattern, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-accent/5 rounded-[18px] border border-accent/10">
                        <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{pattern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-accent" />
                    Consejos Accionables
                  </h3>
                  <div className="space-y-4">
                    {insight.tips.map((tip, i) => (
                      <div key={i} className="p-5 bg-bg-primary dark:bg-[--dark-bg-primary] rounded-[24px] border border-border-subtle dark:border-[--dark-border-subtle] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50" />
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1 block">Consejo {i + 1}</span>
                        <p className="text-sm font-medium leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-accent text-bg-primary rounded-[32px] shadow-xl shadow-accent/20 relative overflow-hidden">
                  <Quote className="absolute -top-4 -right-4 w-24 h-24 opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">Sabiduría Semanal</p>
                  <p className="text-xl font-serif italic leading-relaxed">"{insight.weeklyWisdom}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-border-subtle dark:border-[--dark-border-subtle] flex justify-center bg-bg-primary/50 dark:bg-[--dark-bg-primary]/50">
            <button
              onClick={onClose}
              className="iterum-button-primary px-12"
            >
              Entendido, vamos a por la próxima semana
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
