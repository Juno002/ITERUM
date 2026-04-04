import React from 'react';
import { Objective } from '../types';
import { cn } from '../utils';
import { motion, useAnimationControls } from 'motion/react';
import { Target } from 'lucide-react';

interface ObjectiveCardProps {
  objective: Objective;
  onEdit: (objective: Objective) => void;
}

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  onEdit,
}) => {
  const isAchieved = objective.status === 'achieved' || objective.progress >= 100;

  // The base box shadow radiates from the bottom unless achieved, then it surrounds it.
  const dynamicShadow = isAchieved
    ? `0 0 20px -2px ${objective.color_hint}40, inset 0 0 10px 1px ${objective.color_hint}1a` // Aura perimetral
    : `0 15px 30px -10px ${objective.color_hint}40`; // Fuego lento inferior

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onEdit(objective)}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden p-6 min-h-[160px] cursor-pointer rounded-3xl transition-all duration-500",
        "bg-[#0a0a0a] border border-[#1a1a1a]"
      )}
      style={{
        boxShadow: dynamicShadow,
      }}
    >
      {/* Latido Micro-Animado: Solo respira si está activo */}
      {!isAchieved && (
        <motion.div
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(circle at center bottom, ${objective.color_hint} 0%, transparent 60%)`
          }}
        />
      )}

      {/* Si logró el 100%, brilla distinto en el centro */}
      {isAchieved && (
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none mix-blend-screen"
          animate={{ 
            opacity: [0.1, 0.4, 0.1],
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            background: `linear-gradient(45deg, transparent 20%, ${objective.color_hint}20 50%, transparent 80%)`,
            backgroundSize: "200% 200%"
          }}
        />
      )}

      {/* Top Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-1 pr-12">
          <h3 className={cn(
            "text-xl font-bold tracking-tight transition-colors duration-500",
            isAchieved ? "text-[#c9935a]" : "text-text-primary group-hover:text-white"
          )}>
            {objective.title}
          </h3>
          {objective.description && (
            <p className="text-text-muted line-clamp-2 text-xs font-serif italic mt-2 opacity-60">
              "{objective.description}"
            </p>
          )}
        </div>
      </div>

      {/* Bottom Area: Progress */}
      <div className="relative z-10 flex items-end justify-between mt-8">
        <div>
           {/* Placeholder for future tags or categories if needed, right now kept minimalist */}
        </div>

        {/* Minimalist Circular SVG Ring */}
        <div className="relative flex items-center justify-center w-12 h-12">
          {!isAchieved ? (
            <>
              {/* Contenedor del Aro */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="22"
                  className="stroke-[#1a1a1a]"
                  strokeWidth="1" /* Sub-pixel aesthetics */
                  fill="none"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="22"
                  stroke={objective.color_hint}
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "138 138", strokeDashoffset: 138 }}
                  animate={{ strokeDashoffset: 138 - (138 * objective.progress) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                />
              </svg>
              <div className="font-sans text-[10px] tracking-widest font-bold text-text-secondary">
                {objective.progress}%
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center w-full h-full rounded-full border border-[#c9935a]/30 bg-[#c9935a]/10"
            >
              <Target className="w-5 h-5 text-[#c9935a]" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
