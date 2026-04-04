import React from 'react';
import {
  Plus,
  Search,
  Target,
  Zap,
  BookOpen,
  LayoutGrid,
  Calendar as CalendarIcon,
  Archive as ArchiveIcon,
  Repeat,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { ViewMode } from '../types';
import { cn } from '../utils';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: string;
  toggleTheme: () => void;
  onNewObjective: () => void;
  onCapture: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  theme,
  toggleTheme,
  onNewObjective,
  onCapture,
  onSignOut,
}) => {
  const navItems: { mode: ViewMode; label: string; icon: any }[] = [
    { mode: 'today', label: 'Hoy', icon: Zap },
    { mode: 'habits', label: 'Hábitos', icon: Repeat },
    { mode: 'objectives', label: 'Objetivos', icon: Target },
    { mode: 'journal', label: 'Diario', icon: BookOpen },
    { mode: 'week', label: 'Semana', icon: LayoutGrid },
    { mode: 'month', label: 'Mes', icon: CalendarIcon },
    { mode: 'archive', label: 'Archivo', icon: ArchiveIcon },
  ];

  return (
    <header className="bg-bg-primary/80 border-border-subtle sticky top-0 z-20 border-b backdrop-blur-xl dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]/80">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-8 px-6">
        <div className="flex flex-shrink-0 items-center gap-3">
          <div className="bg-accent shadow-accent/20 flex h-10 w-10 items-center justify-center rounded-[12px] shadow-lg">
            <span className="text-bg-primary text-xl font-bold">I</span>
          </div>
          <h1 className="hidden text-2xl font-bold tracking-tight md:block">Iterum</h1>
        </div>

        <nav className="bg-bg-secondary border-border-subtle hidden items-center rounded-[18px] border p-1.5 lg:flex dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => setViewMode(item.mode)}
              className={cn(
                'flex items-center gap-2 rounded-[14px] px-5 py-2 text-sm font-medium transition-all duration-300',
                viewMode === item.mode
                  ? 'bg-bg-primary text-accent shadow-sm dark:bg-[--dark-bg-primary]'
                  : 'text-text-muted hover:text-text-primary dark:text-[--dark-text-muted] dark:hover:text-[--dark-text-primary]',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-shrink-0 items-center gap-4">
          <div className="group relative hidden sm:block">
            <Search className="text-text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="iterum-input w-48 pl-10 focus:w-64"
            />
          </div>

          <button
            onClick={toggleTheme}
            className="text-text-muted hover:text-accent bg-bg-secondary border-border-subtle rounded-[14px] border p-2.5 transition-all dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            onClick={onSignOut}
            className="text-text-muted hover:text-accent bg-bg-secondary border-border-subtle rounded-[14px] border p-2.5 transition-all dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]"
            title="Cerrar Sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewObjective}
              className="text-text-muted hover:text-accent bg-bg-secondary border-border-subtle rounded-[14px] border p-2.5 transition-all dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]"
              title="Nuevo Objetivo"
            >
              <Target className="h-5 w-5" />
            </button>
            <button onClick={onCapture} className="iterum-button-primary flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Capturar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
