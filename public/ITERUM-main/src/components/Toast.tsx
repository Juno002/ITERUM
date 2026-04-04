import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X } from 'lucide-react';

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'level-up';
}

export function Toast({ isOpen, onClose, title, message, type = 'info' }: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
        >
          <div className="bg-bg-secondary dark:bg-[--dark-bg-secondary] border border-accent/20 rounded-[24px] p-4 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-[16px] flex items-center justify-center text-accent">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">{title}</h4>
              <p className="text-xs text-text-muted dark:text-[--dark-text-muted]">{message}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
