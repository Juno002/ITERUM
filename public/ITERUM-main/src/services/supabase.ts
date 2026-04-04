import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Basic service to handle data synchronization
 */
export class SyncService {
  static async syncData(userId: string, data: any) {
    if (!supabase) return null;

    const { error } = await supabase
      .from('user_data')
      .upsert({ 
        user_id: userId, 
        payload: data, 
        updated_at: new Date().toISOString() 
      });

    if (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  static async fetchData(userId: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('user_data')
      .select('payload')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('Fetch failed:', error);
      throw error;
    }

    return data?.payload || null;
  }
}
