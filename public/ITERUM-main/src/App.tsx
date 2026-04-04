import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  Plus, 
  Sparkles, 
  Search, 
  Moon, 
  Sun, 
  Target, 
  Zap, 
  BookOpen,
  Archive as ArchiveIcon,
  ChevronRight,
  Repeat,
  Flame
} from 'lucide-react';
import { useTasks } from './hooks/useTasks';
import { useHabits } from './hooks/useHabits';
import { useObjectives } from './hooks/useObjectives';
import { useDayClosure } from './hooks/useDayClosure';
import { useGamification } from './hooks/useGamification';
import { ViewMode, Task, Habit, Objective, WeeklyInsight } from './types';
import { cn } from './utils';
import { shouldHabitOccurOnDate, calculateObjectiveProgress } from './utils/habitUtils';
import { ListView } from './components/ListView';
import { CalendarView } from './components/CalendarView';
import { WeekView } from './components/WeekView';
import { JournalView } from './components/JournalView';
import { TaskModal } from './components/TaskModal';
import { HabitModal } from './components/HabitModal';
import { HabitCard } from './components/HabitCard';
import { ObjectiveModal } from './components/ObjectiveModal';
import { ObjectiveCard } from './components/ObjectiveCard';
import { CloseDayModal } from './components/CloseDayModal';
import { AISuggestionModal } from './components/AISuggestionModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Toast } from './components/Toast';
import confetti from 'canvas-confetti';
import { soundManager } from './utils/sounds';

import { WeeklyReviewModal } from './components/WeeklyReviewModal';
import { WeeklyInsightService } from './services/WeeklyInsightService';
import { AIInsightBanner } from './components/AIInsightBanner';
import { es } from 'date-fns/locale';
import { subDays } from 'date-fns';
import { SyncService } from './services/supabase';

export default function App() {
  const [toast, setToast] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const handleLevelUp = (level: number) => {
    soundManager.playSuccess();
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F27D26', '#E6E6E6', '#141414']
    });
    setToast({
      isOpen: true,
      title: '¡Nivel Completado!',
      message: `Has alcanzado el Nivel ${level}. Sigue así, Junior.`
    });
  };

  const { tasks, addTask, updateTask, deleteTask, toggleTask, setTasks } = useTasks();
  const { habits, logs, addHabit, updateHabit, deleteHabit, toggleHabitLog: _toggleHabitLog, setHabits, setLogs } = useHabits();
  const { objectives, addObjective, updateObjective, deleteObjective, setObjectives } = useObjectives();
  const { closedDays, isDayClosed, closeDay, calculateStreak, setClosedDays, weeklyInsights, addWeeklyInsight, setWeeklyInsights } = useDayClosure();
  const { stats, addExp, completeOnboarding, setStats } = useGamification({ onLevelUp: handleLevelUp });

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Unique User ID management
  const [userId] = useState(() => {
    const saved = localStorage.getItem('iterum_user_id');
    if (saved) return saved;
    const newId = `user_${crypto.randomUUID()}`;
    localStorage.setItem('iterum_user_id', newId);
    return newId;
  });

  const handleSync = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setToast({
        isOpen: true,
        title: 'Configuración Requerida',
        message: 'Configura las variables de Supabase en .env para activar el Sync.'
      });
      return;
    }

    setIsSyncing(true);
    try {
      const allData = {
        tasks,
        habits,
        logs,
        objectives,
        closedDays,
        weeklyInsights,
        stats
      };
      
      await SyncService.syncData(userId, allData);
      
      setToast({
        isOpen: true,
        title: 'Sincronización Exitosa',
        message: 'Tus datos están seguros en la nube.'
      });
    } catch (error) {
      console.error('Sync failed', error);
      setToast({
        isOpen: true,
        title: 'Error de Sincronización',
        message: 'No se pudo conectar con el servidor.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setToast({
        isOpen: true,
        title: 'Configuración Requerida',
        message: 'Configura las variables de Supabase en .env para activar el Restore.'
      });
      return;
    }

    if (!window.confirm('¿Estás seguro? Esto sobrescribirá tus datos locales con los de la nube.')) {
      return;
    }

    setIsRestoring(true);
    try {
      const cloudData = await SyncService.fetchData(userId);
      
      if (!cloudData) {
        setToast({
          isOpen: true,
          title: 'Sin datos',
          message: 'No se encontraron datos en la nube para este usuario.'
        });
        return;
      }

      // Restore all states
      if (cloudData.tasks) setTasks(cloudData.tasks.map((t: any) => ({ ...t, date: new Date(t.date) })));
      if (cloudData.habits) setHabits(cloudData.habits.map((h: any) => ({ ...h, createdAt: new Date(h.createdAt), archivedAt: h.archivedAt ? new Date(h.archivedAt) : undefined })));
      if (cloudData.logs) setLogs(cloudData.logs.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt) })));
      if (cloudData.objectives) setObjectives(cloudData.objectives.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt), deadline: o.deadline ? new Date(o.deadline) : undefined })));
      if (cloudData.closedDays) setClosedDays(cloudData.closedDays.map((d: any) => ({ ...d, closedAt: new Date(d.closedAt) })));
      if (cloudData.weeklyInsights) setWeeklyInsights(cloudData.weeklyInsights.map((i: any) => ({ ...i, generatedAt: new Date(i.generatedAt) })));
      if (cloudData.stats) setStats(cloudData.stats);

      setToast({
        isOpen: true,
        title: 'Restauración Exitosa',
        message: 'Tus datos han sido recuperados.'
      });
    } catch (error) {
      console.error('Restore failed', error);
      setToast({
        isOpen: true,
        title: 'Error de Restauración',
        message: 'No se pudo recuperar los datos del servidor.'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Auto-sync effect
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;
    
    const timer = setTimeout(() => {
      const allData = { tasks, habits, logs, objectives, closedDays, weeklyInsights, stats };
      SyncService.syncData(userId, allData).catch(console.error);
    }, 10000); // Sync after 10 seconds of inactivity

    return () => clearTimeout(timer);
  }, [tasks, habits, logs, objectives, closedDays, weeklyInsights, stats, userId]);

  const generateWeeklyInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      const service = new WeeklyInsightService(process.env.GEMINI_API_KEY || '');
      const journalReflections = tasks
        .filter(t => t.type === 'journal' && t.content)
        .map(t => ({ date: format(t.date, 'yyyy-MM-dd'), content: t.content || '' }));
      
      const insight = await service.generateWeeklyInsight(habits, logs, objectives, journalReflections);
      addWeeklyInsight(insight);
      setWeeklyInsight(insight);
      setIsWeeklyReviewOpen(true);
    } catch (error) {
      console.error('Failed to generate weekly insight', error);
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo generar el análisis semanal. Inténtalo de nuevo.'
      });
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const getDailyStats = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.date === dateStr);
      const activeHabitsCount = habits.filter(h => h.isActive).length;
      const rate = activeHabitsCount > 0 ? dayLogs.length / activeHabitsCount : 0;
      return {
        day: format(date, 'EEE', { locale: es }),
        rate: Math.min(rate, 1)
      };
    });
  };

  const handleToggleMilestone = (objectiveId: string, milestoneId: string) => {
    const objective = objectives.find(o => o.id === objectiveId);
    if (!objective || !objective.milestones) return;

    const updatedMilestones = objective.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date() : undefined } : m
    );

    updateObjective(objectiveId, { milestones: updatedMilestones });
    
    // Award EXP for completing a milestone
    const milestone = objective.milestones.find(m => m.id === milestoneId);
    if (milestone && !milestone.completed) {
      addExp(25, 'discipline');
      soundManager.playSuccess();
      setToast({
        isOpen: true,
        title: '¡Hito Alcanzado!',
        message: `Has completado: ${milestone.title}`
      });
    }
  };

  const toggleHabitLog = (habitId: string, date: Date, value?: number, note?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingLog = logs.find(l => l.habitId === habitId && l.date === dateStr);
    
    // Award EXP for first check-in or note
    if (!existingLog) {
      addExp(10, 'discipline');
      soundManager.playPop();
    } else if (note && !existingLog.note) {
      addExp(8, 'consistency');
    }

    _toggleHabitLog(habitId, date, value, note);
  };
  
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
  const [objectiveToEdit, setObjectiveToEdit] = useState<Objective | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate real-time progress for objectives
  const objectivesWithProgress = useMemo(() => {
    return objectives.map(obj => ({
      ...obj,
      currentValue: calculateObjectiveProgress(obj, habits, logs)
    }));
  }, [objectives, habits, logs]);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setTaskToEdit(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setHabitToEdit(habit);
    setIsHabitModalOpen(true);
  };

  const handleEditObjective = (objective: Objective) => {
    setObjectiveToEdit(objective);
    setIsObjectiveModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setTimeout(() => setTaskToEdit(undefined), 200);
  };

  const handleCloseHabitModal = () => {
    setIsHabitModalOpen(false);
    setTimeout(() => setHabitToEdit(undefined), 200);
  };

  const handleCloseObjectiveModal = () => {
    setIsObjectiveModalOpen(false);
    setTimeout(() => setObjectiveToEdit(undefined), 200);
  };

  const handleOpenCloseDayModal = () => {
    setIsCloseDayModalOpen(true);
  };

  const handleConfirmCloseDay = async () => {
    const result = await closeDay(new Date(), habits, logs, tasks, updateTask, addTask);
    if (result) {
      addExp(25, 'consistency');
    }
    return result;
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'completed'> & { habitData?: any, objectiveData?: any }) => {
    if (taskToEdit) {
      updateTask(taskToEdit.id, taskData);
    } else if (taskData.type === 'habit') {
      addHabit({
        name: taskData.title,
        description: taskData.description,
        frequency: taskData.habitData?.frequency || 'daily',
        type: taskData.habitData?.type || 'yesno',
        targetValue: taskData.habitData?.targetValue,
        unit: taskData.habitData?.unit,
        color: taskData.color,
      });
    } else if (taskData.type === 'objective') {
      addObjective({
        title: taskData.title,
        description: taskData.description,
        targetValue: taskData.objectiveData?.targetValue || 100,
        currentValue: 0,
        unit: taskData.objectiveData?.unit || '%',
        deadline: taskData.objectiveData?.deadline,
        color: taskData.color,
      });
    } else {
      addTask(taskData);
    }
  };

  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'isActive' | 'createdAt'>) => {
    if (habitToEdit) {
      updateHabit(habitToEdit.id, habitData);
    } else {
      addHabit(habitData);
    }
  };

  const handleSaveObjective = (objectiveData: Omit<Objective, 'id' | 'isActive' | 'createdAt'>) => {
    if (objectiveToEdit) {
      updateObjective(objectiveToEdit.id, objectiveData);
    } else {
      addObjective(objectiveData);
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHabits = habits.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredObjectives = objectivesWithProgress.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayHabits = habits.filter(h => h.isActive && shouldHabitOccurOnDate(h.frequency, new Date()));

  const navItems: { mode: ViewMode; label: string; icon: any }[] = [
    { mode: 'today', label: 'Hoy', icon: Zap },
    { mode: 'habits', label: 'Hábitos', icon: Repeat },
    { mode: 'objectives', label: 'Objetivos', icon: Target },
    { mode: 'journal', label: 'Diario', icon: BookOpen },
    { mode: 'week', label: 'Semana', icon: LayoutGrid },
    { mode: 'month', label: 'Mes', icon: CalendarIcon },
    { mode: 'archive', label: 'Archivo', icon: ArchiveIcon },
  ];

  const streak = calculateStreak();

  return (
    <div className={cn(
      "min-h-screen bg-bg-primary dark:bg-[--dark-bg-primary] text-text-primary dark:text-[--dark-text-primary] font-sans transition-all duration-700",
      isFocusMode && "bg-black text-white/90"
    )}>
      {/* Focus Mode Overlay */}
      {isFocusMode && (
        <div className="fixed inset-0 z-[100] bg-black pointer-events-none opacity-40 mix-blend-multiply" />
      )}
      
      {/* Header */}
      {!isFocusMode && (
        <header className="sticky top-0 z-20 bg-bg-primary/80 dark:bg-[--dark-bg-primary]/80 backdrop-blur-xl border-b border-border-subtle dark:border-[--dark-border-subtle]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-accent rounded-[12px] flex items-center justify-center shadow-lg shadow-accent/20">
              <span className="text-bg-primary font-bold text-xl">I</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight hidden md:block">Iterum</h1>
          </div>
          
          <nav className="hidden lg:flex items-center bg-bg-secondary dark:bg-[--dark-bg-secondary] p-1.5 rounded-[18px] border border-border-subtle dark:border-[--dark-border-subtle]">
            {navItems.map((item) => (
              <button
                key={item.mode}
                onClick={() => setViewMode(item.mode)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-[14px] text-sm font-medium transition-all duration-300",
                  viewMode === item.mode 
                    ? "bg-bg-primary dark:bg-[--dark-bg-primary] text-accent shadow-sm" 
                    : "text-text-muted dark:text-[--dark-text-muted] hover:text-text-primary dark:hover:text-[--dark-text-primary]"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="iterum-input pl-10 w-48 focus:w-64"
              />
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 text-text-muted hover:text-accent bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[14px] border border-border-subtle dark:border-[--dark-border-subtle] transition-all"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsAIModalOpen(true)}
              className="p-2.5 text-accent bg-accent/10 hover:bg-accent/20 rounded-[14px] transition-all"
              title="Sugerir IA"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setObjectiveToEdit(undefined);
                  setIsObjectiveModalOpen(true);
                }}
                className="p-2.5 text-text-muted hover:text-accent bg-bg-secondary dark:bg-[--dark-bg-secondary] rounded-[14px] border border-border-subtle dark:border-[--dark-border-subtle] transition-all"
                title="Nuevo Objetivo"
              >
                <Target className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setTaskToEdit(undefined);
                  setIsTaskModalOpen(true);
                }}
                className="iterum-button-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Capturar</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    )}

    {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-10">
          {/* View Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-accent font-semibold uppercase tracking-widest text-xs">
              {viewMode === 'today' && <Zap className="w-3 h-3" />}
              {viewMode === 'habits' && <Repeat className="w-3 h-3" />}
              {viewMode === 'objectives' && <Target className="w-3 h-3" />}
              {viewMode === 'journal' && <BookOpen className="w-3 h-3" />}
              {viewMode === 'week' && <LayoutGrid className="w-3 h-3" />}
              {viewMode === 'month' && <CalendarIcon className="w-3 h-3" />}
              {viewMode === 'today' ? 'Ejecución' : viewMode.toUpperCase()}
            </div>
            <h2 className="text-4xl font-bold capitalize">
              {viewMode === 'today' ? 'Hoy' : viewMode === 'habits' ? 'Hábitos' : viewMode === 'objectives' ? 'Objetivos' : viewMode === 'journal' ? 'Diario' : viewMode}
            </h2>
            {viewMode === 'today' && (
              <div className="flex flex-col gap-6">
                <AIInsightBanner habits={habits} logs={logs} tasks={tasks} />
                
                {streak >= 7 && !isDayClosed(new Date()) && (
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-[24px] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/20">
                        <Flame className="w-5 h-5 text-bg-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">¡Estás en racha de {streak} días!</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest">¿Qué tal un nuevo objetivo mensual?</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setObjectiveToEdit(undefined);
                        setIsObjectiveModalOpen(true);
                      }}
                      className="px-4 py-2 bg-accent text-bg-primary rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      Crear Objetivo
                    </button>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <p className="text-text-muted dark:text-[--dark-text-muted]">
                    {filteredTasks.filter(t => !t.completed).length} ítems prioritarios para hoy.
                  </p>
                  <button 
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                      isDayClosed(new Date()) 
                        ? "bg-green-500/10 text-green-500 cursor-default" 
                        : "bg-accent/10 text-accent hover:bg-accent/20"
                    )}
                    onClick={isDayClosed(new Date()) ? undefined : handleOpenCloseDayModal}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isDayClosed(new Date()) ? 'Día Cerrado' : 'Cerrar Día'}
                  </button>
                </div>

                {isDayClosed(new Date()) && (
                  <div className="p-6 bg-accent/5 border border-accent/10 rounded-[24px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Sparkles className="w-12 h-12 text-accent" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        Resumen IA de hoy
                      </p>
                      <p className="text-sm font-medium italic text-text-primary dark:text-[--dark-text-primary]">
                        "{closedDays.find(d => d.date === format(new Date(), 'yyyy-MM-dd'))?.summary}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic View Rendering */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-12">
              {viewMode === 'habits' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredHabits.map(habit => (
                    <HabitCard 
                      key={habit.id} 
                      habit={habit} 
                      logs={logs} 
                      onToggle={(id) => toggleHabitLog(id, new Date())}
                      onEdit={handleEditHabit}
                      onAddNote={(id, note) => toggleHabitLog(id, new Date(), undefined, note)}
                    />
                  ))}
                  {filteredHabits.length === 0 && (
                    <div className="col-span-full py-20 text-center iterum-card border-dashed">
                      <p className="text-text-muted">No hay hábitos activos. Crea uno para empezar.</p>
                    </div>
                  )}
                </div>
              ) : viewMode === 'objectives' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredObjectives.map(objective => (
                    <ObjectiveCard 
                      key={objective.id} 
                      objective={objective} 
                      onEdit={handleEditObjective}
                      onToggleMilestone={handleToggleMilestone}
                    />
                  ))}
                  {filteredObjectives.length === 0 && (
                    <div className="col-span-full py-20 text-center iterum-card border-dashed">
                      <p className="text-text-muted">No hay objetivos activos. Define uno para empezar.</p>
                    </div>
                  )}
                </div>
              ) : viewMode === 'journal' ? (
                <JournalView 
                  tasks={tasks} 
                  weeklyInsights={weeklyInsights}
                  onEdit={handleEditTask} 
                  onViewInsight={(insight) => {
                    setWeeklyInsight(insight);
                    setIsWeeklyReviewOpen(true);
                  }}
                />
              ) : viewMode === 'today' ? (
                <div className="space-y-12">
                  {todayHabits.length > 0 && (
                    <section className="space-y-6">
                      <h3 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        Hábitos de Hoy
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {todayHabits.map(habit => (
                          <HabitCard 
                            key={habit.id} 
                            habit={habit} 
                            logs={logs} 
                            onToggle={(id) => toggleHabitLog(id, new Date())}
                            onEdit={handleEditHabit}
                            onAddNote={(id, note) => toggleHabitLog(id, new Date(), undefined, note)}
                            compact
                          />
                        ))}
                      </div>
                    </section>
                  )}
                  
                  <ListView 
                    tasks={filteredTasks} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask}
                    onEdit={handleEditTask}
                  />
                </div>
              ) : viewMode === 'week' ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Análisis Semanal</h2>
                      <p className="text-text-muted dark:text-[--dark-text-muted] text-sm">Tu evolución y patrones de conducta</p>
                    </div>
                    <button
                      onClick={generateWeeklyInsight}
                      disabled={isGeneratingInsight}
                      className="iterum-button-primary flex items-center gap-2"
                    >
                      {isGeneratingInsight ? (
                        <div className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isGeneratingInsight ? 'Analizando...' : 'Generar Sabiduría Semanal'}
                    </button>
                  </div>
                  <WeekView 
                    habits={habits}
                    logs={logs}
                    userLevel={stats.level}
                  />
                </div>
              ) : (
                <CalendarView 
                  tasks={filteredTasks} 
                  onDateSelect={handleDateSelect}
                  onToggle={toggleTask}
                  onEdit={handleEditTask}
                />
              )}
            </div>

            {/* Sidebar - Contextual Info */}
            <aside className="lg:col-span-4 space-y-8">
              <section className="iterum-card bg-accent/5 border-accent/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-accent rounded-[16px] flex items-center justify-center text-bg-primary font-bold text-xl shadow-lg shadow-accent/20">
                    {stats.level}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Nivel {stats.level}</span>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stats.totalExp % 100} / 100 EXP</span>
                    </div>
                    <div className="h-2 bg-bg-primary dark:bg-[--dark-bg-primary] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-500" 
                        style={{ width: `${(stats.totalExp % 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-bg-primary/50 dark:bg-black/20 rounded-[12px]">
                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Disciplina</p>
                    <p className="text-xs font-bold text-accent">Lvl {stats.discipline.level}</p>
                  </div>
                  <div className="text-center p-2 bg-bg-primary/50 dark:bg-black/20 rounded-[12px]">
                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Consistencia</p>
                    <p className="text-xs font-bold text-accent">Lvl {stats.consistency.level}</p>
                  </div>
                </div>
              </section>

              <section className="iterum-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent-secondary" />
                    Objetivos
                  </h3>
                  <button 
                    onClick={() => setViewMode('objectives')}
                    className="p-1 text-text-muted hover:text-accent transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {objectivesWithProgress.slice(0, 3).map(obj => {
                    const progress = Math.min(100, Math.round((obj.currentValue / obj.targetValue) * 100));
                    return (
                      <div key={obj.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate max-w-[150px]">{obj.title}</span>
                          <span className="text-accent">{progress}%</span>
                        </div>
                        <div className="h-2 bg-bg-primary dark:bg-[--dark-bg-primary] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%`, backgroundColor: obj.color }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                  {objectives.length === 0 && (
                    <p className="text-xs text-text-muted italic text-center py-4">Sin objetivos activos</p>
                  )}
                </div>
              </section>

              <section className="iterum-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Journal
                  </h3>
                  <div className="flex items-center gap-2">
                    {stats.level >= 5 && (
                      <button 
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        className={cn(
                          "px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all",
                          isFocusMode ? "bg-accent text-bg-primary" : "bg-bg-secondary text-text-muted hover:text-accent"
                        )}
                      >
                        {isFocusMode ? 'Salir Foco' : 'Modo Foco'}
                      </button>
                    )}
                    <button className="text-xs text-accent font-semibold">NUEVO</button>
                  </div>
                </div>
                <p className="text-sm text-text-muted dark:text-[--dark-text-muted] italic">
                  "El foco no es lo que haces, sino lo que dejas de hacer..."
                </p>
              </section>

              <section className="iterum-card border-dashed">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Datos y Respaldo</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      const data = { habits, logs, objectives, tasks, closedDays, weeklyInsights, stats };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `iterum-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
                      a.click();
                    }}
                    className="py-2 px-4 rounded-[12px] border border-border-subtle dark:border-[--dark-border-subtle] text-[10px] font-bold text-text-muted hover:text-accent hover:border-accent/30 transition-all flex items-center justify-center gap-2"
                  >
                    <ArchiveIcon className="w-3 h-3" />
                    Exportar
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing || isRestoring}
                    className="py-2 px-4 rounded-[12px] border border-border-subtle dark:border-[--dark-border-subtle] text-[10px] font-bold text-text-muted hover:text-accent hover:border-accent/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isSyncing ? (
                      <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {isSyncing ? 'Subiendo...' : 'Sync Cloud'}
                  </button>
                  <button
                    onClick={handleRestore}
                    disabled={isSyncing || isRestoring}
                    className="col-span-2 py-2 px-4 rounded-[12px] border border-border-subtle dark:border-[--dark-border-subtle] text-[10px] font-bold text-text-muted hover:text-accent hover:border-accent/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isRestoring ? (
                      <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    ) : (
                      <ArchiveIcon className="w-3 h-3" />
                    )}
                    {isRestoring ? 'Restaurando...' : 'Restaurar Cloud'}
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>

      {/* Modals */}
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={handleCloseTaskModal} 
        onSave={handleSaveTask}
        initialDate={selectedDate}
        taskToEdit={taskToEdit}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={handleCloseHabitModal}
        onSave={handleSaveHabit}
        habitToEdit={habitToEdit}
        objectives={objectives}
        userLevel={stats.level}
      />

      <ObjectiveModal
        isOpen={isObjectiveModalOpen}
        onClose={handleCloseObjectiveModal}
        onSave={handleSaveObjective}
        objectiveToEdit={objectiveToEdit}
        habits={habits}
      />

      <CloseDayModal
        isOpen={isCloseDayModalOpen}
        onClose={() => setIsCloseDayModalOpen(false)}
        onConfirm={handleConfirmCloseDay}
        tasks={tasks}
        habits={habits}
        logs={logs}
      />
      
      <AISuggestionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onApply={(suggestedTasks) => {
          suggestedTasks.forEach(t => addTask(t));
          setIsAIModalOpen(false);
        }}
      />

      {/* Mobile FAB */}
      <div className="fixed bottom-8 right-6 z-40 sm:hidden">
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setTaskToEdit(undefined);
            setIsTaskModalOpen(true);
          }}
          className="w-16 h-16 bg-accent text-bg-primary rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {!stats.onboardingCompleted && (
        <OnboardingWizard onComplete={completeOnboarding} />
      )}

      <Toast 
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
        title={toast.title}
        message={toast.message}
      />

      {weeklyInsight && (
        <WeeklyReviewModal
          isOpen={isWeeklyReviewOpen}
          onClose={() => setIsWeeklyReviewOpen(false)}
          insight={weeklyInsight}
          dailyStats={getDailyStats()}
        />
      )}
    </div>
  );
}
