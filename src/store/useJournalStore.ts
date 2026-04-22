import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { JournalEntry } from '../types';
import { iterumStateStorage } from '../core/storage/iterumStorage';

interface JournalState {
  journals: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  addJournal: (text: string, objectiveId?: string) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
}

function reviveJournal(entry: JournalEntry): JournalEntry {
  return {
    ...entry,
    created_at: new Date(entry.created_at).toISOString(),
  };
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      journals: [],
      isLoading: false,
      error: null,
      addJournal: async (text, objectiveId) => {
        const rawPayload = JSON.stringify({ text, objectiveId: objectiveId ?? null });
        const optimisticEntry: JournalEntry = {
          id: crypto.randomUUID(),
          payload: rawPayload,
          created_at: new Date().toISOString(),
          text,
          objectiveId,
        };

        set((state) => ({
          journals: [optimisticEntry, ...state.journals],
        }));
      },
      deleteJournal: async (id) => {
        set((state) => ({
          journals: state.journals.filter((journal) => journal.id !== id),
        }));
      },
    }),
    {
      name: 'iterum_journals_v1',
      storage: createJSONStorage(() => iterumStateStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.journals = state.journals.map(reviveJournal);
      },
    },
  ),
);
