import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Mail, Lock, User, Github, Chrome, ArrowRight, Loader2, Info } from 'lucide-react';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onSuccess?: () => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase!.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase!.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        setError('Check your email for the confirmation link!');
      }
      if (isLogin && onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase!.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-primary/80 border-border-subtle w-full max-w-md overflow-hidden rounded-[40px] border shadow-2xl backdrop-blur-2xl dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]/80"
      >
        <div className="p-10">
          <div className="mb-10 text-center">
            <div className="bg-accent mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[24px] shadow-2xl shadow-accent/20">
              <User className="text-bg-primary h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isLogin ? 'Bienvenido a ITERUM' : 'Únete a la Forja'}
            </h2>
            <p className="text-text-muted mt-2 text-sm">
              {isLogin ? 'Tu progreso te espera.' : 'Comienza tu camino a la maestría.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-text-muted ml-4 text-[10px] font-bold tracking-widest uppercase">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="text-text-muted absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="iterum-input w-full pl-12"
                      placeholder="Marcus Aurelius"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-text-muted ml-4 text-[10px] font-bold tracking-widest uppercase">
                Email
              </label>
              <div className="relative">
                <Mail className="text-text-muted absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="iterum-input w-full pl-12"
                  placeholder="imperator@roma.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-text-muted ml-4 text-[10px] font-bold tracking-widest uppercase">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="text-text-muted absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="iterum-input w-full pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-accent/5 border-accent/20 flex items-start gap-3 rounded-[20px] border p-4 text-xs font-medium"
              >
                <Info className="text-accent mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-text-primary leading-relaxed dark:text-[--dark-text-primary]">
                  {error}
                </span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="iterum-button-primary group w-full justify-center py-4 text-sm"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar' : 'Registrarse'}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="border-border-subtle w-full border-t dark:border-[--dark-border-subtle]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold tracking-widest uppercase">
              <span className="bg-bg-primary px-4 text-text-muted dark:bg-[--dark-bg-primary]">
                O continuar con
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSocialLogin('google')}
              className="bg-bg-secondary border-border-subtle hover:border-accent/40 flex items-center justify-center gap-3 rounded-[20px] border py-3 transition-all dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]"
            >
              <Chrome className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin('github')}
              className="bg-bg-secondary border-border-subtle hover:border-accent/40 flex items-center justify-center gap-3 rounded-[20px] border py-3 transition-all dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]"
            >
              <Github className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">GitHub</span>
            </button>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-text-muted hover:text-accent text-[10px] font-bold tracking-widest uppercase transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Registrate' : '¿Ya tienes cuenta? Entra'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
