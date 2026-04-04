import { supabase } from './supabase';
import { Habit, HabitLog, Task, Objective, UserStats } from '../types';

export const dbService = {
  // PROFILES
  async getProfile(userId: string) {
    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserStats>) {
    // Map UserStats to profile columns
    const profileUpdates: any = {};
    if (updates.totalExp !== undefined) profileUpdates.total_exp = updates.totalExp;
    if (updates.level !== undefined) profileUpdates.level = updates.level;
    if (updates.discipline?.exp !== undefined) profileUpdates.discipline_exp = updates.discipline.exp;
    if (updates.discipline?.level !== undefined) profileUpdates.discipline_level = updates.discipline.level;
    if (updates.consistency?.exp !== undefined) profileUpdates.consistency_exp = updates.consistency.exp;
    if (updates.consistency?.level !== undefined) profileUpdates.consistency_level = updates.consistency.level;
    if (updates.onboardingCompleted !== undefined) profileUpdates.onboarding_completed = updates.onboardingCompleted;

    const { error } = await supabase!
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);
    if (error) throw error;
  },

  // HABITS
  async getHabits(userId: string) {
    const { data, error } = await supabase!
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createHabit(userId: string, habit: Omit<Habit, 'id' | 'createdAt' | 'isActive'> & { isActive?: boolean }) {
    const { data, error } = await supabase!
      .from('habits')
      .insert([{ ...habit, user_id: userId, is_active: habit.isActive ?? true }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateHabit(userId: string, habitId: string, updates: Partial<Habit>) {
    const { error } = await supabase!
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteHabit(userId: string, habitId: string) {
    const { error } = await supabase!
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // HABIT LOGS
  async getHabitLogs(userId: string) {
    const { data, error } = await supabase!
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async upsertHabitLog(userId: string, log: Omit<HabitLog, 'id' | 'createdAt'> & { id?: string }) {
    const { data, error } = await supabase!
      .from('habit_logs')
      .upsert({ ...log, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteHabitLog(userId: string, logId: string) {
    const { error } = await supabase!
      .from('habit_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // TASKS
  async getTasks(userId: string) {
    const { data, error } = await supabase!
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createTask(userId: string, task: Omit<Task, 'id' | 'createdAt'>) {
    const { data, error } = await supabase!
      .from('tasks')
      .insert([{ ...task, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTask(userId: string, taskId: string, updates: Partial<Task>) {
    const { error } = await supabase!
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteTask(userId: string, taskId: string) {
    const { error } = await supabase!
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // OBJECTIVES
  async getObjectives(userId: string) {
    const { data, error } = await supabase!
      .from('objectives')
      .select('*, milestones(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async createObjective(userId: string, objective: Omit<Objective, 'id' | 'createdAt'>) {
    const { milestones, ...objData } = objective;
    const { data: newObj, error: objError } = await supabase!
      .from('objectives')
      .insert([{ ...objData, user_id: userId }])
      .select()
      .single();
    
    if (objError) throw objError;

    if (milestones && milestones.length > 0) {
      const { error: milError } = await supabase!
        .from('milestones')
        .insert(milestones.map((m: any) => ({ ...m, objective_id: newObj.id, user_id: userId })));
      if (milError) throw milError;
    }

    return newObj;
  }
};
