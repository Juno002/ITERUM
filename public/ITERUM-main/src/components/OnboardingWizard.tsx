import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Target, 
  Repeat, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { cn } from '../utils';

type Step = {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
};

const STEPS: Step[] = [
  {
    id: 0,
    title: "Bienvenido a Iterum",
    description: "Iterum es tu compañero para cerrar ciclos diarios de forma consciente y construir una vida con propósito.",
    icon: Sparkles,
    color: "text-accent"
  },
  {
    id: 1,
    title: "Hábitos con Intención",
    description: "No solo taches tareas. Registra tus hábitos, añade reflexiones y mira cómo tus rachas crecen día a día.",
    icon: Repeat,
    color: "text-accent-secondary"
  },
  {
    id: 2,
    title: "Objetivos Claros",
    description: "Vincula tus hábitos diarios a metas a largo plazo. Cada pequeña acción te acerca a tu gran objetivo.",
    icon: Target,
    color: "text-green-500"
  },
  {
    id: 3,
    title: "Gamificación Real",
    description: "Gana EXP por tu disciplina y consistencia. Desbloquea nuevas funciones a medida que subes de nivel.",
    icon: Trophy,
    color: "text-yellow-500"
  }
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg-primary/90 dark:bg-[--dark-bg-primary]/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[32px] border border-border-subtle dark:border-[--dark-border-subtle] shadow-2xl overflow-hidden"
      >
        <div className="p-10">
          <div className="flex justify-between items-center mb-12">
            <div className="flex gap-1.5">
              {STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    idx === currentStep ? "w-8 bg-accent" : "w-2 bg-border-subtle dark:bg-[--dark-border-subtle]"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Paso {currentStep + 1} de {STEPS.length}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className={cn("w-20 h-20 mx-auto rounded-[24px] bg-bg-primary dark:bg-[--dark-bg-primary] flex items-center justify-center mb-8 shadow-inner", step.color)}>
                <Icon className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">{step.title}</h2>
              <p className="text-text-muted dark:text-[--dark-text-muted] leading-relaxed mb-12">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all",
                currentStep === 0 ? "opacity-0 pointer-events-none" : "text-text-muted hover:text-text-primary dark:hover:text-[--dark-text-primary]"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </button>
            
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-accent text-bg-primary rounded-full text-sm font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
            >
              {currentStep === STEPS.length - 1 ? 'Empezar ahora' : 'Siguiente'}
              {currentStep === STEPS.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {currentStep === 3 && (
          <div className="bg-accent/5 border-t border-border-subtle dark:border-[--dark-border-subtle] p-6 text-center">
            <p className="text-xs font-medium text-accent flex items-center justify-center gap-2">
              <Zap className="w-3 h-3" />
              ¡Nivel 2 desbloquea colores personalizados para tus hábitos!
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
