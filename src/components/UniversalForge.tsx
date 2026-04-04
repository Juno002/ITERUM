import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { cn } from '../utils';
import { parseIntent, ForgingIntent } from '../utils/intentParser';
import { feedback } from '../utils/feedback';
import { useTaskStore } from '../store/useTaskStore';
import { useObjectiveStore } from '../store/useObjectiveStore';

interface UniversalForgeProps {
  isFabExpanded: boolean;
}

export function UniversalForge({ isFabExpanded }: UniversalForgeProps) {
  const [isForging, setIsForging] = useState(false);
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [intent, setIntent] = useState<ForgingIntent>('task');
  const inputRef = useRef<HTMLInputElement>(null);
  const prevIntentRef = useRef<ForgingIntent>('task');
  const addTask = useTaskStore(state => state.addTask);
  const addObjective = useObjectiveStore(state => state.addObjective);

  useEffect(() => {
    if (isForging && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isForging]);

  useEffect(() => {
    const parsed = parseIntent(text);
    setIntent(parsed.type);
    
    // Haptic Tick when Intent changes
    if (parsed.type !== prevIntentRef.current) {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      prevIntentRef.current = parsed.type;
    }

    // Smart Pause: Expand details panel after 1.5s of no typing if we have real content
    const timeout = setTimeout(() => {
      if (text.trim().length > 3 && !isExpanded) {
        setIsExpanded(true);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [text, isExpanded]);

  const injectPrefix = (prefix: string) => {
    setText(prefix);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsForging(false);
      setIsExpanded(false);
      setText('');
      setNotes('');
      setTags('');
      // Need a subtle suck-in sound/vibration here
    }
    
    // Manual expand via Shift+Enter
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setIsExpanded(prev => !prev);
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!text.trim()) return;
      
      const parsed = parseIntent(text);
      if (!parsed.cleanText) return;

      // Persist based on intent
      if (parsed.type === 'task') {
        feedback.tap();
        addTask({
          title: parsed.cleanText,
          description: notes.trim() + (tags ? ` \nEtiquetas: ${tags}` : ''),
          date: new Date(),
          type: 'task'
        });
      } else if (parsed.type === 'habit') {
        feedback.tap();
        console.log("Create Habit:", parsed.cleanText, { notes, tags });
      } else if (parsed.type === 'goal') {
        feedback.success();
        addObjective({
          title: parsed.cleanText,
          description: notes.trim() + (tags ? ` \nEtiquetas: ${tags}` : ''),
          status: 'active',
          progress: 0,
          color_hint: '#c9935a'
        });
      } else if (parsed.type === 'journal') {
        feedback.undo();
        console.log("Log Reflection:", parsed.cleanText, { notes, tags });
      }

      setIsForging(false);
      setIsExpanded(false);
      setText('');
      setNotes('');
      setTags('');
    }
  };

  // Determine dynamic styling based on intent
  const getDynamicStyles = () => {
    if (intent === 'journal') {
      return "backdrop-blur-xl bg-opacity-40 bg-[#0C0C0C] border border-[#1a202c] shadow-[0_0_20px_rgba(26,32,44,0.5)] caret-blue-900 dark:caret-blue-300";
    }
    if (intent === 'goal') {
      return "bg-bg-primary shadow-[0_0_15px_rgba(201,147,90,0.4)] border border-accent/50";
    }
    // Default task/habit
    return "bg-bg-primary border border-border-subtle shadow-2xl";
  };

  const getPlaceholder = () => {
    if (intent === 'journal') return "Ecribe en el vacío...";
    if (intent === 'goal') return "Define tu cúspide...";
    if (intent === 'habit') return "Define tu disciplina diaria...";
    return "¿Qué vas a forjar?";
  };

  return (
    <motion.div 
      className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-0 right-0 flex flex-col items-center justify-end z-40 px-4"
      animate={{ y: (!isForging && !isFabExpanded) ? 20 : 0 }}
      layout
    >
      {/* Predictive Toolbar (Mobile First) */}
      <AnimatePresence>
        {isForging && intent === 'task' && !text.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-3 mb-4"
          >
            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => injectPrefix('* ')}
              className="flex items-center justify-center h-11 min-w-[44px] px-4 rounded-full bg-bg-secondary border border-border-subtle shadow-lg text-sm font-bold tracking-widest text-text-primary active:scale-90 transition-transform"
            >
              * HÁBITO
            </button>
            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => injectPrefix('> ')}
              className="flex items-center justify-center h-11 min-w-[44px] px-4 rounded-full bg-[#1a1c23] border border-[#2d3748] shadow-[0_0_15px_rgba(45,55,72,0.5)] text-sm font-serif italic text-blue-300 active:scale-90 transition-transform"
            >
              {'> '} Diario
            </button>
            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => injectPrefix('Meta: ')}
              className="flex items-center justify-center h-11 min-w-[44px] px-4 rounded-full bg-[#2c2215] border border-[#c9935a]/50 shadow-[0_0_15px_rgba(201,147,90,0.3)] text-sm font-bold tracking-widest text-[#c9935a] active:scale-90 transition-transform"
            >
              META:
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isForging ? (
          /* The FAB State */
          <motion.button
            key="fab"
            layoutId="forge-container"
            onClick={() => setIsForging(true)}
            className="flex items-center justify-center rounded-full bg-accent text-bg-primary shadow-2xl transition-all active:scale-90 overflow-hidden"
            animate={{
              width: isFabExpanded ? 160 : 56,
              height: 56,
              borderRadius: 28,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <AnimatePresence mode="wait">
              {isFabExpanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-bold tracking-[0.1em] text-sm uppercase">FORJAR</span>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Plus className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ) : (
          /* The Command Palette State */
          <motion.div
            key="palette"
            layoutId="forge-container"
            className={cn(
              "flex flex-col px-4 overflow-hidden transition-colors duration-300 pointer-events-auto",
              getDynamicStyles()
            )}
            style={{
              paddingTop: isExpanded ? '12px' : '0px',
              paddingBottom: isExpanded ? '12px' : '0px'
            }}
          >
            {/* TOP BAR: Intent Icon & Input */}
            <div className="flex items-center w-full min-h-[56px] h-auto">
              <div className="mr-3 flex items-center justify-center shrink-0">
                 {intent === 'task' && <div className="h-2 w-2 rounded-full bg-text-muted opacity-50" />}
                 {intent === 'habit' && <div className="h-3 w-3 rounded border border-accent rotate-45" />}
                 {intent === 'journal' && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                 {intent === 'goal' && <div className="h-3 w-3 rounded-sm bg-accent shadow-[0_0_8px_rgba(201,147,90,0.8)]" />}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!text && !isExpanded) setIsForging(false);
                }}
                placeholder={getPlaceholder()}
                className={cn(
                  "w-full bg-transparent outline-none placeholder:opacity-40 transition-all text-[16px]",
                  intent === 'journal' ? "font-serif text-white" : "font-sans text-text-primary",
                  intent === 'goal' ? "font-bold tracking-tight md:text-xl" : "md:text-base",
                  isExpanded ? "mb-2" : "h-full"
                )}
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            {/* EXPANDED DETAILS PANEL */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col gap-2 border-t border-border-subtle pt-3 mt-1"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-[#c9935a] font-bold">
                      [ NOTAS ]
                    </span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Detalles sobre la intención..."
                      className="bg-transparent text-xs outline-none resize-none font-sans min-h-[40px] w-full mt-1 text-text-secondary placeholder:opacity-30"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-[#c9935a] font-bold">
                      [ ETIQUETAS ]
                    </span>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. trabajo, urgente..."
                      className="bg-transparent text-xs outline-none font-sans w-full mt-1 text-text-secondary placeholder:opacity-30"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
