import { useState } from 'react';
import { useUIStore } from '../store/useUIStore';

/**
 * useSync - Cloud sync hook
 * 
 * With Phase 2, individual stores now handle their own sync with Supabase
 * via dbService. This hook is kept for backward compatibility with the
 * Sidebar UI but its manual sync/restore actions are no longer needed.
 */
export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { setToast } = useUIStore();

  const handleSync = async () => {
    setIsSyncing(true);
    // Data now syncs automatically per-store via dbService
    setTimeout(() => {
      setToast({
        isOpen: true,
        title: 'Sincronización Activa',
        message: 'Tus datos se sincronizan automáticamente con la nube.',
      });
      setIsSyncing(false);
    }, 800);
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setTimeout(() => {
      setToast({
        isOpen: true,
        title: 'Datos Actualizados',
        message: 'Los datos se cargan automáticamente al iniciar sesión.',
      });
      setIsRestoring(false);
    }, 800);
  };

  return { isSyncing, isRestoring, handleSync, handleRestore };
}
