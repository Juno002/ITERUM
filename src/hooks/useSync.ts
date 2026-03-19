import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useHabitStore } from '../store/useHabitStore';
import { useObjectiveStore } from '../store/useObjectiveStore';
import { useUserStore } from '../store/useUserStore';
import { SyncService } from '../services/supabase';
import { useUIStore } from '../store/useUIStore';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { setToast } = useUIStore();
  const { userId } = useUserStore();
  
  const tasks = useTaskStore(state => state.tasks);
  const habits = useHabitStore(state => state.habits);
  const logs = useHabitStore(state => state.logs);
  const objectives = useObjectiveStore(state => state.objectives);
  const closedDays = useUserStore(state => state.closedDays);
  const weeklyInsights = useUserStore(state => state.weeklyInsights);
  const stats = useUserStore(state => state.stats);

  const { setTasks } = useTaskStore();
  const { setHabits, setLogs } = useHabitStore();
  const { setObjectives } = useObjectiveStore();
  const { setClosedDays, setWeeklyInsights, setStats } = useUserStore();

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

  return { isSyncing, isRestoring, handleSync, handleRestore };
}
