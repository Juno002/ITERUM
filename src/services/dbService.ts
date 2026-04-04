import { supabase } from './supabase';
import { Habit, HabitLog, Task, Objective, UserStats } from '../types';

/**
 * Asserts that the Supabase client is initialized.
 * Throws a descriptive error instead of crashing with null dereference.
 */
function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
    );
  }
  return supabase;
}

export const dbService = {
  // PROFILES
  async getProfile(userId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserStats>) {
    const client = requireSupabase();
    const profileUpdates: Record<string, unknown> = {};
    if (updates.totalExp !== undefined) profileUpdates.total_exp = updates.totalExp;
    if (updates.level !== undefined) profileUpdates.level = updates.level;
    if (updates.discipline?.exp !== undefined) profileUpdates.discipline_exp = updates.discipline.exp;
    if (updates.discipline?.level !== undefined) profileUpdates.discipline_level = updates.discipline.level;
    if (updates.consistency?.exp !== undefined) profileUpdates.consistency_exp = updates.consistency.exp;
    if (updates.consistency?.level !== undefined) profileUpdates.consistency_level = updates.consistency.level;
    if (updates.onboardingCompleted !== undefined) profileUpdates.onboarding_completed = updates.onboardingCompleted;

    const { error } = await client
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);
    if (error) throw error;
  },

  // HABITS
  async getHabits(userId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createHabit(userId: string, habit: Omit<Habit, 'id' | 'createdAt' | 'isActive'> & { isActive?: boolean }) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('habits')
      .insert([{ ...habit, user_id: userId, is_active: habit.isActive ?? true }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateHabit(userId: string, habitId: string, updates: Partial<Habit>) {
    const client = requireSupabase();
    const { error } = await client
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteHabit(userId: string, habitId: string) {
    const client = requireSupabase();
    const { error } = await client
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // HABIT LOGS
  async getHabitLogs(userId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async upsertHabitLog(userId: string, log: Omit<HabitLog, 'id' | 'createdAt'> & { id?: string }) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('habit_logs')
      .upsert({ ...log, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteHabitLog(userId: string, logId: string) {
    const client = requireSupabase();
    const { error } = await client
      .from('habit_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // TASKS
  async getTasks(userId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createTask(userId: string, task: Omit<Task, 'id' | 'createdAt'>) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('tasks')
      .insert([{ ...task, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTask(userId: string, taskId: string, updates: Partial<Task>) {
    const client = requireSupabase();
    const { error } = await client
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteTask(userId: string, taskId: string) {
    const client = requireSupabase();
    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // OBJECTIVES
  async getObjectives(userId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('objectives')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createObjective(userId: string, objective: Omit<Objective, 'id' | 'created_at' | 'user_id'>) {
    const client = requireSupabase();
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const { data, error } = await client
        .from('objectives')
        .insert([{ ...objective, user_id: userId }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        const fakeId = (objective as any).id || crypto.randomUUID();
        useSyncQueueStore.getState().enqueue('objective', 'create', userId, { ...objective, id: fakeId });
        return { ...objective, id: fakeId, created_at: new Date().toISOString() };
      }
      throw e;
    }
  },

  async updateObjective(userId: string, objectiveId: string, updates: Partial<Objective>) {
    const client = requireSupabase();
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const { error } = await client
        .from('objectives')
        .update(updates)
        .eq('id', objectiveId)
        .eq('user_id', userId);
        
      if (error) throw error;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        useSyncQueueStore.getState().enqueue('objective', 'update', userId, updates, objectiveId);
        return;
      }
      throw e;
    }
  },
  
  async deleteObjective(userId: string, objectiveId: string) {
    const client = requireSupabase();
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const { error } = await client
        .from('objectives')
        .delete()
        .eq('id', objectiveId)
        .eq('user_id', userId);
        
      if (error) throw error;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        useSyncQueueStore.getState().enqueue('objective', 'delete', userId, {}, objectiveId);
        return;
      }
      throw e;
    }
  },

  // JOURNALS
  async getJournals(userId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('journals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createJournal(userId: string, journal: Omit<import('../types').JournalEntry, 'id' | 'created_at' | 'user_id' | 'text' | 'objectiveId'>) {
    const client = requireSupabase();
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const { data, error } = await client
        .from('journals')
        .insert([{ payload: journal.payload, user_id: userId }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        const fakeId = (journal as any).id || crypto.randomUUID();
        useSyncQueueStore.getState().enqueue('journal', 'create', userId, { ...journal, id: fakeId });
        return { ...journal, id: fakeId, created_at: new Date().toISOString() };
      }
      throw e;
    }
  },

  async deleteJournal(userId: string, journalId: string) {
    const client = requireSupabase();
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const { error } = await client
        .from('journals')
        .delete()
        .eq('id', journalId)
        .eq('user_id', userId);
        
      if (error) throw error;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        useSyncQueueStore.getState().enqueue('journal', 'delete', userId, {}, journalId);
        return;
      }
      throw e;
    }
  }
};
