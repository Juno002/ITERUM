import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { JournalEntry } from '../types';
import { dbService } from '../services/dbService';
import { supabase } from '../services/supabase';
import { deriveKeyFromPhrase, EnclaveStore, encryptData, decryptData } from '../utils/crypto';

interface JournalState {
  journals: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  fetchJournals: () => Promise<void>;
  addJournal: (text: string, objectiveId?: string) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      journals: [],
      isLoading: false,
      error: null,

      fetchJournals: async () => {
        try {
          set({ isLoading: true, error: null });
          const user = (await supabase?.auth.getUser())?.data.user;
          if (!user) {
            set({ journals: [], isLoading: false });
            return;
          }

          const data = await dbService.getJournals(user.id);
          
          let decryptedData = data;
          const phrase = await EnclaveStore.loadKeyReference();
          
          if (phrase) {
             const key = await deriveKeyFromPhrase(phrase);
             decryptedData = await Promise.all(data.map(async (entry: JournalEntry) => {
               try {
                 if (entry.payload.startsWith('E2EE::')) {
                    const parts = entry.payload.replace('E2EE::', '').split('::');
                    if (parts.length === 2) {
                        const rawJson = await decryptData(parts[0], parts[1], key);
                        const parsed = JSON.parse(rawJson);
                        return { ...entry, text: parsed.text, objectiveId: parsed.objectiveId };
                    }
                 }
               } catch (e) {
                 console.warn("Failed to decrypt journal entry:", entry.id);
               }
               return { ...entry, text: "Contenido cifrado (Error)", objectiveId: null };
             }));
          }

          const { useSyncQueueStore } = await import('./useSyncQueueStore');
          const pendingQueue = useSyncQueueStore.getState().queue.filter(q => q.target === 'journal');
          
          set((state) => {
            const localData = state.journals;
            
            // 1. Empezamos con los datos del servidor (nadie actualiza journals, así que update is rare, pero por si acaso)
            const merged = decryptedData.map((serverEntry: any) => {
               return serverEntry;
            });
    
            // 2. Filtramos deletes locales
            const afterDeletes = merged.filter((entry: any) => 
               !pendingQueue.some(q => q.action === 'delete' && q.entityId === entry.id)
            );
    
            // 3. Añadimos creates locales
            const localCreates = localData.filter(l => 
               pendingQueue.some(q => q.action === 'create' && q.payload?.id === l.id)
            );
    
            return { journals: [...localCreates, ...afterDeletes], isLoading: false };
          });
          
        } catch (error: any) {
          console.error("Error fetching journals:", error);
          set({ error: error.message, isLoading: false });
        }
      },

      addJournal: async (text: string, objectiveId?: string) => {
        try {
          const user = (await supabase?.auth.getUser())?.data.user;
          if (!user) throw new Error("Unauthenticated");

          const tempId = crypto.randomUUID();
          
          const rawPayload = JSON.stringify({ text, objectiveId: objectiveId || null });
          let payloadStr = rawPayload;
          
          const phrase = await EnclaveStore.loadKeyReference();
          if (phrase) {
             const key = await deriveKeyFromPhrase(phrase);
             const { cipher, iv } = await encryptData(rawPayload, key);
             payloadStr = `E2EE::${cipher}::${iv}`;
          }

          const optimisticEntry: JournalEntry = {
            id: tempId,
            user_id: user.id,
            payload: payloadStr,
            created_at: new Date().toISOString(),
            text,
            objectiveId
          };

          set((state) => ({
            journals: [optimisticEntry, ...state.journals]
          }));

          const savedEntry = await dbService.createJournal(user.id, { payload: payloadStr });

          set((state) => ({
            journals: state.journals.map(j => j.id === tempId ? { ...j, id: savedEntry.id } : j)
          }));
        } catch (error: any) {
           console.error("Error adding journal:", error);
           get().fetchJournals();
        }
      },

      deleteJournal: async (id: string) => {
         try {
           const user = (await supabase?.auth.getUser())?.data.user;
           if (!user) return;
           
           set(state => ({
             journals: state.journals.filter(j => j.id !== id)
           }));
           
           await dbService.deleteJournal(user.id, id);
         } catch (error: any) {
            console.error("Error deleting journal:", error);
            get().fetchJournals();
         }
      }
    }),
    {
      name: 'iterum_journals_v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
