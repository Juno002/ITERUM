import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '../store/useUIStore';
import { useObjectiveStore } from '../store/useObjectiveStore';
import { getDailyPrompt } from '../utils/prompts';
import { feedback } from '../utils/feedback';
import { Check, ArrowRight, Target } from 'lucide-react';
import { cn } from '../utils';

import { EnclaveStore, generateRecoveryPhrase, deriveKeyFromPhrase, encryptData } from '../utils/crypto';

// Util to map text containing @mentions to colored spans in a background div
function RichTextOverlay({ text, colorHint, linkedWord }: { text: string, colorHint?: string, linkedWord?: string }) {
  if (!linkedWord || !colorHint) return <>{text}</>;
  
  const regex = new RegExp(`(${linkedWord})`, 'g');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((p, i) => 
        p === linkedWord ? (
          <span key={i} style={{ color: colorHint }} className="transition-colors duration-1000">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export function CeremonyChamber() {
  const { ceremonyState, setCeremonyState } = useUIStore();
  const objectives = useObjectiveStore(state => state.objectives);
  const fetchObjectives = useObjectiveStore(state => state.fetchObjectives);

  const [journalText, setJournalText] = useState('');
  const [prompt, setPrompt] = useState('');
  const [recoveryPhraseVisible, setRecoveryPhraseVisible] = useState<string | null>(null);

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<{ query: string, index: number, prefix: string } | null>(null);
  const [linkedObjective, setLinkedObjective] = useState<{ id: string, name: string, color: string, word: string } | null>(null);

  useEffect(() => {
    if (ceremonyState === 'entering') {
      fetchObjectives();
      setPrompt(getDailyPrompt());
      // Auto move to ritual after a brief pause
      const t = setTimeout(() => {
        setCeremonyState('ritual');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [ceremonyState, setCeremonyState, fetchObjectives]);

  // Handle Mentions Parsing
  useEffect(() => {
    // Detect if the user is typing a mention (e.g. "@..." or "#...") at the end of the text
    const match = journalText.match(/(?:^|\s)([@#])(\w*)$/);
    if (match && match.index !== undefined) {
      setMentionQuery({ prefix: match[1], query: match[2].toLowerCase(), index: match.index });
    } else {
      setMentionQuery(null);
    }
  }, [journalText]);

  const activeObjectives = objectives.filter(o => o.status !== 'archived');
  const filteredObjectives = mentionQuery 
    ? activeObjectives.filter(o => o.title.toLowerCase().includes(mentionQuery.query))
    : [];

  const handleSelectMention = (objective: any) => {
    if (!mentionQuery) return;
    navigator.vibrate?.(30); // Single sustained soft haptic pulse
    
    // Replace the query with the actual objective name
    const before = journalText.substring(0, mentionQuery.index);
    // Add the space if there was one before the prefix
    const spacePrefix = journalText[mentionQuery.index] === ' ' ? ' ' : '';
    const replacement = `${spacePrefix}${mentionQuery.prefix}${objective.title.replace(/\s+/g, '')} `;
    
    setJournalText(before + replacement);
    setMentionQuery(null);
    setLinkedObjective({ 
      id: objective.id, 
      name: objective.title, 
      color: objective.color_hint, 
      word: `${mentionQuery.prefix}${objective.title.replace(/\s+/g, '')}` 
    });
  };

  // Calculate opacity based on typing (weight transfer)
  // Max opacity reduction at 200 characters
  const fogOpacity = Math.max(0.2, 1 - Math.min(200, journalText.length) / 200);

  const handleSeal = async () => {
    if (journalText.length < 10) return; // Prevent accidental empty seals
    
    // Crypto Enclave Execution
    let phrase = await EnclaveStore.loadKeyReference();
    if (!phrase) {
        phrase = await generateRecoveryPhrase();
        await EnclaveStore.saveKeyReference(phrase);
        setRecoveryPhraseVisible(phrase);
    }
    
    const key = await deriveKeyFromPhrase(phrase);
    
    const { useJournalStore } = await import('../store/useJournalStore');
    await useJournalStore.getState().addJournal(journalText, linkedObjective?.id);
    
    console.log("[Iterum Secure Enclave] Journal Entry Sealed with E2EE");
    
    feedback.celebrate();
    setCeremonyState('sealed');
  };

  if (ceremonyState === 'idle') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="ceremony-chamber"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 1.5 } }}
        className={cn(
          "fixed inset-0 z-[150] flex flex-col items-center justify-center p-6 sm:p-12 transition-colors duration-1000",
          ceremonyState === 'sealed' ? "bg-[#f5efe6] text-[#2c1f14] dark:bg-[#e6dccf]" : "bg-[#0C0C0C] text-[#ede0d0]"
        )}
      >
        {ceremonyState === 'sealed' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 2 }}
            className="text-center max-w-2xl"
          >
            <h1 className="font-sans text-2xl font-bold tracking-[0.2em] mb-4 uppercase text-[#2c1f14]">
              [ DESCANSA. LA FORJA TE ESPERA MAÑANA. ]
            </h1>
            {recoveryPhraseVisible && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3, duration: 1 }}
                className="mt-12 bg-[#2c1f14] text-[#ede0d0] p-8 rounded-[32px] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-[#c9935a]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#c9935a] mb-4">
                  Tu Clave Maestra de Recuperación
                </h3>
                <p className="text-sm opacity-80 mb-6 max-w-md mx-auto">
                  Tu diario ha sido sellado con criptografía Zero-Knowledge (AES-GCM). Solo esta frase puede descifrar la Bóveda en caso de perder este dispositivo. Copíala en un lugar seguro.
                </p>
                <div className="bg-[#1a120b] p-4 rounded-xl flex flex-wrap gap-2 justify-center font-mono">
                  {recoveryPhraseVisible.split(' ').map((word: string, i: number) => (
                    <span key={i} className="text-xs bg-[#0C0C0C] px-3 py-1 rounded-md text-white/90">
                      {i + 1}. {word}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <>
            {/* Dynamic Fog Background with Chromatic Transition */}
            <motion.div
              className="absolute inset-0 pointer-events-none transition-colors duration-[2000ms] ease-in-out"
              animate={{ opacity: fogOpacity }}
              transition={{ duration: 0.5 }}
              style={{
                backgroundColor: linkedObjective ? linkedObjective.color : '#0C0C0C',
                // Keep it very dark even with the color hint, acting as a deep aura
                backgroundImage: linkedObjective ? `radial-gradient(circle at 50% 50%, transparent 20%, #0C0C0C 80%)` : 'none',
                mixBlendMode: linkedObjective ? 'color' : 'normal'
              }}
            />
            {/* The actual darkness veil to ensure readability isn't compromised */}
            <div className="absolute inset-0 bg-[#0C0C0C]/80 pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center flex-1 py-20">
              {/* Daily Prompt */}
              <motion.h2 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-center mb-16 font-sans text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: ceremonyState === 'ritual' ? 1 : 0.4, y: 0 }}
                transition={{ duration: 1.5 }}
              >
                {prompt}
              </motion.h2>

              {/* Cognitive Unload Area */}
              <AnimatePresence>
                {ceremonyState === 'ritual' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="w-full flex-1 flex flex-col relative"
                  >
                    <div className="relative w-full h-full">
                      {/* Fake overlay for rich text color */}
                      <div className="absolute inset-0 text-lg md:text-xl font-serif leading-relaxed pointer-events-none whitespace-pre-wrap break-words text-transparent z-10">
                        <RichTextOverlay text={journalText} colorHint={linkedObjective?.color} linkedWord={linkedObjective?.word} />
                      </div>
                      
                      {/* Actual transparent textarea */}
                      <textarea
                        autoFocus
                        value={journalText}
                        onChange={(e) => setJournalText(e.target.value)}
                        placeholder="Escribe en el vacío..."
                        className="absolute inset-0 w-full h-full bg-transparent text-lg md:text-xl text-white/90 placeholder:text-white/20 resize-none outline-none font-serif leading-relaxed z-20 caret-white"
                        style={{ color: linkedObjective ? 'rgba(255, 255, 255, 0.9)' : undefined }}
                        spellCheck={false}
                      />
                    </div>

                    {/* Mention Menu */}
                    <AnimatePresence>
                      {mentionQuery && filteredObjectives.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute z-50 bottom-24 left-0 w-full sm:w-80 bg-[#0C0C0C]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                        >
                          <div className="p-2 border-b border-white/5 text-[10px] text-text-muted font-bold tracking-widest uppercase flex items-center gap-2">
                            <Target className="w-3 h-3" />
                            Selecciona una Meta
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredObjectives.map((obj) => (
                              <button
                                key={obj.id}
                                onClick={() => handleSelectMention(obj)}
                                className="w-full text-left p-3 hover:bg-white/5 transition-colors flex items-center justify-between"
                              >
                                <span className="text-white/90 font-sans text-sm">{obj.title}</span>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: obj.color_hint }} />
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Seal Sequence trigger */}
                    {journalText.length >= 10 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute -bottom-10 left-0 right-0 flex justify-center"
                      >
                        <button
                          onClick={handleSeal}
                          className="flex items-center gap-3 text-[#c9935a] hover:text-white transition-colors group px-6 py-4"
                        >
                          <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Swipe para Sellar</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
