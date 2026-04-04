import { useEffect, useMemo, useState } from 'react';
import { supabase } from './services/supabase';
import { Auth } from './components/Auth';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useTasks } from './hooks/useTasks';
import { useHabits } from './hooks/useHabits';
import { useObjectives } from './hooks/useObjectives';
import { useDayClosure } from './hooks/useDayClosure';
import { useGamification } from './hooks/useGamification';
import { useSync } from './hooks/useSync';
import { useUIStore } from './store/useUIStore';
import { useTheme } from './context/ThemeContext';
import { Task, Habit, Objective } from './types';
import { cn } from './utils';
import { shouldHabitOccurOnDate, calculateObjectiveProgress } from './utils/habitUtils';
import { TaskModal } from './components/TaskModal';
import { HabitModal } from './components/HabitModal';
import { ObjectiveModal } from './components/ObjectiveModal';
import { CloseDayModal } from './components/CloseDayModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Toast } from './components/Toast';
import confetti from 'canvas-confetti';
import { soundManager } from './utils/sounds';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ViewHeader } from './components/ViewHeader';
import { ViewManager } from './components/ViewManager';
import { useUserStore } from './store/useUserStore';
import { Session } from '@supabase/supabase-js';
import { migrationService } from './services/migrationService';
import { dbService } from './services/dbService';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    viewMode,
    setViewMode,
    isFocusMode,
    setIsFocusMode,
    toast,
    setToast,
    closeToast,
  } = useUIStore();
  const { theme, toggleTheme } = useTheme();

  const handleLevelUp = (level: number) => {
    soundManager.playSuccess();
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F27D26', '#E6E6E6', '#141414'],
    });
    setToast({
      isOpen: true,
      title: '¡Nivel Completado!',
      message: `Has alcanzado el Nivel ${level}. Sigue así, Junior.`,
    });
  };

  const { stats, addExp, completeOnboarding } = useGamification({ onLevelUp: handleLevelUp });
  const { closedDays, isDayClosed, closeDay, calculateStreak, weeklyInsights } = useDayClosure();
  const { loadProfile, setUserId } = useUserStore();

  const { loadHabits, loadLogs, habits, logs, addHabit, updateHabit, toggleHabitLog: _toggleHabitLog } = useHabits();
  const { loadObjectives, objectives, addObjective, updateObjective } = useObjectives();
  const { loadTasks, tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { isSyncing, isRestoring, handleSync, handleRestore } = useSync();

  useEffect(() => {
    if (session?.user && !isMigrating) {
      const uid = session.user.id;
      setUserId(uid);

      const initData = async () => {
        try {
          // Check if profile exists and has data
          const profile = await dbService.getProfile(uid);
          
          if (!profile || (profile.total_exp === 0 && !profile.onboarding_completed)) {
            // Check if local data exists
            const hasLocalData = !!localStorage.getItem('iterum_user_storage');
            
            if (hasLocalData) {
              setIsMigrating(true);
              setToast({
                isOpen: true,
                title: 'Migrando Datos...',
                message: 'Estamos moviendo tu progreso local a la nube.',
              });
              await migrationService.migrateLocalToCloud(uid);
              setToast({
                isOpen: true,
                title: '¡Migración Exitosa!',
                message: 'Tus datos ahora están seguros en la nube.',
              });
              setIsMigrating(false);
            }
          }

          loadProfile(uid);
          loadHabits(uid);
          loadLogs(uid);
          loadTasks(uid);
          loadObjectives(uid);
        } catch (error) {
          console.error('Initialization error:', error);
          loadProfile(uid);
          loadHabits(uid);
          loadLogs(uid);
          loadTasks(uid);
          loadObjectives(uid);
        }
      };

      initData();
    } else if (!session) {
      setUserId(null);
    }
  }, [session, setUserId, loadProfile, loadHabits, loadLogs, loadTasks, loadObjectives, isMigrating, setToast]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
  const [objectiveToEdit, setObjectiveToEdit] = useState<Objective | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleMilestone = (objectiveId: string, milestoneId: string) => {
    const objective = objectives.find((o) => o.id === objectiveId);
    if (!objective || !objective.milestones) return;

    const updatedMilestones = objective.milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date() : undefined }
        : m,
    );

    updateObjective(objectiveId, { milestones: updatedMilestones });

    // Award EXP for completing a milestone
    const milestone = objective.milestones.find((m) => m.id === milestoneId);
    if (milestone && !milestone.completed) {
      addExp(25, 'discipline');
      soundManager.playSuccess();
      setToast({
        isOpen: true,
        title: '¡Hito Alcanzado!',
        message: `Has completado: ${milestone.title}`,
      });
    }
  };

  const toggleHabitLog = (habitId: string, date: Date, value?: number, note?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingLog = logs.find((l) => l.habitId === habitId && l.date === dateStr);

    // Award EXP for first check-in or note
    if (!existingLog) {
      addExp(10, 'discipline');
      soundManager.playPop();
    } else if (note && !existingLog.note) {
      addExp(8, 'consistency');
    }

    _toggleHabitLog(habitId, date, value, note);
  };

  const objectivesWithProgress = useMemo(() => {
    return objectives.map((obj) => ({
      ...obj,
      currentValue: calculateObjectiveProgress(obj, habits, logs),
    }));
  }, [objectives, habits, logs]);

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

  const handleSaveTask = (
    taskData: Omit<Task, 'id' | 'completed' | 'createdAt'> & { 
      habitData?: Partial<Habit>; 
      objectiveData?: Partial<Objective>; 
    },
  ) => {
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

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredHabits = habits.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredObjectives = objectivesWithProgress.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const todayHabits = habits.filter(
    (h) => h.isActive && shouldHabitOccurOnDate(h.frequency, new Date()),
  );

  const streak = calculateStreak();

  if (!session) {
    return (
      <div
        className={cn(
          'bg-bg-primary text-text-primary min-h-screen font-sans transition-all duration-700 dark:bg-[--dark-bg-primary] dark:text-[--dark-text-primary]',
        )}
      >
        <Auth />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-bg-primary text-text-primary min-h-screen font-sans transition-all duration-700 dark:bg-[--dark-bg-primary] dark:text-[--dark-text-primary]',
        isFocusMode && 'bg-black text-white/90',
      )}
    >
      {/* Focus Mode Overlay */}
      {isFocusMode && (
        <div className="pointer-events-none fixed inset-0 z-[100] bg-black opacity-40 mix-blend-multiply" />
      )}

      {/* Header */}
      {!isFocusMode && (
        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          toggleTheme={toggleTheme}
          onSignOut={async () => {
            await supabase!.auth.signOut();
            setSession(null);
          }}
          onNewObjective={() => {
            setObjectiveToEdit(undefined);
            setIsObjectiveModalOpen(true);
          }}
          onCapture={() => {
            setSelectedDate(new Date());
            setTaskToEdit(undefined);
            setIsTaskModalOpen(true);
          }}
        />
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-10">
          {/* View Header */}
          <ViewHeader
            viewMode={viewMode}
            streak={streak}
            isDayClosed={isDayClosed}
            handleOpenCloseDayModal={handleOpenCloseDayModal}
            filteredTasks={filteredTasks}
            closedDays={closedDays}
            setIsObjectiveModalOpen={setIsObjectiveModalOpen}
            setObjectiveToEdit={setObjectiveToEdit}
          />

          {/* Dynamic View Rendering */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <ViewManager
              viewMode={viewMode}
              filteredHabits={filteredHabits}
              filteredObjectives={filteredObjectives}
              filteredTasks={filteredTasks}
              todayHabits={todayHabits}
              habits={habits}
              logs={logs}
              tasks={tasks}
              weeklyInsights={weeklyInsights}
              stats={stats}
              toggleHabitLog={toggleHabitLog}
              handleEditHabit={handleEditHabit}
              handleEditObjective={handleEditObjective}
              handleToggleMilestone={handleToggleMilestone}
              handleEditTask={handleEditTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              handleDateSelect={handleDateSelect}
            />

            <Sidebar
              stats={stats}
              objectivesWithProgress={objectivesWithProgress}
              objectives={objectives}
              setViewMode={setViewMode}
              isFocusMode={isFocusMode}
              setIsFocusMode={setIsFocusMode}
              isSyncing={isSyncing}
              isRestoring={isRestoring}
              handleSync={handleSync}
              handleRestore={handleRestore}
              habits={habits}
              logs={logs}
              tasks={tasks}
              closedDays={closedDays}
              weeklyInsights={weeklyInsights}
            />
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
      />

      <ObjectiveModal
        isOpen={isObjectiveModalOpen}
        onClose={handleCloseObjectiveModal}
        onSave={handleSaveObjective}
        objectiveToEdit={objectiveToEdit}
      />

      <CloseDayModal
        isOpen={isCloseDayModalOpen}
        onClose={() => setIsCloseDayModalOpen(false)}
        onConfirm={handleConfirmCloseDay}
      />

      {/* Mobile FAB */}
      <div className="fixed right-6 bottom-8 z-40 sm:hidden">
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setTaskToEdit(undefined);
            setIsTaskModalOpen(true);
          }}
          className="bg-accent text-bg-primary flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-transform active:scale-90"
        >
          <Plus className="h-8 w-8" />
        </button>
      </div>

      {!stats.onboardingCompleted && <OnboardingWizard onComplete={completeOnboarding} />}

      <Toast
        isOpen={toast.isOpen}
        onClose={closeToast}
        title={toast.title}
        message={toast.message}
      />
    </div>
  );
}
