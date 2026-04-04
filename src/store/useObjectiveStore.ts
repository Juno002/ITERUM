import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Objective } from '../types';
import { dbService } from '../services/dbService';
import { supabase } from '../services/supabase';
import { encryptData, decryptData, deriveKeyFromPhrase, EnclaveStore } from '../utils/crypto';

interface ObjectiveState {
  objectives: Objective[];
  isLoading: boolean;
  error: string | null;
  fetchObjectives: () => Promise<void>;
  addObjective: (objective: Omit<Objective, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateObjective: (id: string, updates: Partial<Objective>) => Promise<void>;
  deleteObjective: (id: string) => Promise<void>;
}

async function getEncryptionKey(): Promise<CryptoKey | null> {
  const phrase = await EnclaveStore.loadKeyReference();
  if (!phrase) return null;
  return deriveKeyFromPhrase(phrase);
}

export const useObjectiveStore = create<ObjectiveState>()(
  persist(
    (set, get) => ({
  objectives: [],
  isLoading: false,
  error: null,

  fetchObjectives: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = (await supabase?.auth.getUser())?.data.user;
      if (!user) {
        set({ objectives: [], isLoading: false });
        return;
      }
      
      const data = await dbService.getObjectives(user.id);
      const key = await getEncryptionKey();
      const decryptedData = await Promise.all(data.map(async (obj: Objective) => {
        let title = obj.title;
        let description = obj.description;
        try {
          if (key && title.startsWith('E2EE::')) {
            const parts = title.replace('E2EE::', '').split('::');
            if (parts.length === 2) title = await decryptData(parts[0], parts[1], key);
          }
          if (key && description && description.startsWith('E2EE::')) {
            const parts = description.replace('E2EE::', '').split('::');
            if (parts.length === 2) description = await decryptData(parts[0], parts[1], key);
          }
        } catch(e) { /* silent */ }
        return { ...obj, title, description };
      }));
      
      const { useSyncQueueStore } = await import('./useSyncQueueStore');
      const pendingQueue = useSyncQueueStore.getState().queue.filter(q => q.target === 'objective');
      
      // Smart Merge
      set((state) => {
        const localData = state.objectives;
        
        // 1. Empezamos con los datos del servidor
        const merged = decryptedData.map((serverObj: any) => {
           const localObj = localData.find(l => l.id === serverObj.id);
           // Si el objeto está en la cola pendiente de actualización, conservamos el local
           const isUpdating = pendingQueue.some(q => q.action === 'update' && q.entityId === serverObj.id);
           if (localObj && isUpdating) return localObj;
           return serverObj;
        });

        // 2. Filtramos deletes locales
        const afterDeletes = merged.filter((obj: any) => 
           !pendingQueue.some(q => q.action === 'delete' && q.entityId === obj.id)
        );

        // 3. Añadimos creates locales que aún no están en el servidor
        const localCreates = localData.filter(l => 
           pendingQueue.some(q => q.action === 'create' && q.payload?.id === l.id)
        );

        return { objectives: [...localCreates, ...afterDeletes], isLoading: false };
      });
      
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching objectives:', error);
    }
  },

  addObjective: async (objectiveData) => {
    try {
      const user = (await supabase?.auth.getUser())?.data.user;
      if (!user) throw new Error("User not authenticated");

      // Optimistic update for UI
      const tempId = crypto.randomUUID();
      const optimisticObjective: Objective = {
        ...objectiveData,
        id: tempId,
        progress: objectiveData.progress ?? 0,
        status: objectiveData.status ?? 'active',
        color_hint: objectiveData.color_hint ?? '#c9935a',
        created_at: new Date().toISOString(),
      };
      
      set((state) => ({
        objectives: [optimisticObjective, ...state.objectives]
      }));

      // Background Encryption & Sync
      let payloadToSync = { ...objectiveData };
      const key = await getEncryptionKey();
      
      if (key) {
        const encryptedTitle = await encryptData(payloadToSync.title, key);
        payloadToSync.title = `E2EE::${encryptedTitle.cipher}::${encryptedTitle.iv}`;
        
        if (payloadToSync.description) {
          const encryptedDesc = await encryptData(payloadToSync.description, key);
          payloadToSync.description = `E2EE::${encryptedDesc.cipher}::${encryptedDesc.iv}`;
        }
      }

      const newObjective = await dbService.createObjective(user.id, payloadToSync);
      
      // Update with real ID (keep the unencrypted version in the UI)
      set((state) => ({
        objectives: state.objectives.map(obj => obj.id === tempId ? { ...optimisticObjective, id: newObjective.id } : obj)
      }));
    } catch (error: any) {
      console.error('Error creating objective:', error);
      get().fetchObjectives(); 
    }
  },

  updateObjective: async (id, updates) => {
    try {
      const user = (await supabase?.auth.getUser())?.data.user;
      if (!user) return;

      // Optimistic update
      set((state) => ({
        objectives: state.objectives.map((obj) => 
          obj.id === id ? { ...obj, ...updates } : obj
        )
      }));

      let payloadToSync = { ...updates };
      const key = await getEncryptionKey();
      
      if (key && payloadToSync.title) {
        const encryptedTitle = await encryptData(payloadToSync.title, key);
        payloadToSync.title = `E2EE::${encryptedTitle.cipher}::${encryptedTitle.iv}`;
      }
      
      if (key && payloadToSync.description) {
        const encryptedDesc = await encryptData(payloadToSync.description, key);
        payloadToSync.description = `E2EE::${encryptedDesc.cipher}::${encryptedDesc.iv}`;
      }

      await dbService.updateObjective(user.id, id, payloadToSync);
    } catch (error: any) {
      console.error('Error updating objective:', error);
      get().fetchObjectives();
    }
  },

  deleteObjective: async (id) => {
    try {
      const user = (await supabase?.auth.getUser())?.data.user;
      if (!user) return;

      set((state) => ({
        objectives: state.objectives.filter(obj => obj.id !== id)
      }));

      await dbService.deleteObjective(user.id, id);
    } catch (error: any) {
      console.error('Error deleting objective:', error);
      get().fetchObjectives();
    }
  }
}),
{
  name: 'iterum_objectives_v1',
  storage: createJSONStorage(() => localStorage)
}
));
