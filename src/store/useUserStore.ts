import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserStats, DayClosure, WeeklyInsight } from '../types';

interface UserState {
  userId: string;
  stats: UserStats;
  closedDays: DayClosure[];
  weeklyInsights: WeeklyInsight[];
  setUserId: (id: string) => void;
  setStats: (stats: UserStats) => void;
  addExp: (amount: number, type: 'discipline' | 'consistency', onLevelUp?: (level: number) => void) => void;
  completeOnboarding: () => void;
  setClosedDays: (days: DayClosure[]) => void;
  addClosedDay: (day: DayClosure) => void;
  setWeeklyInsights: (insights: WeeklyInsight[]) => void;
  addWeeklyInsight: (insight: WeeklyInsight) => void;
}

const EXP_PER_LEVEL = 100;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: `user_${crypto.randomUUID()}`,
      stats: {
        discipline: { exp: 0, level: 1 },
        consistency: { exp: 0, level: 1 },
        totalExp: 0,
        level: 1,
        onboardingCompleted: false,
      },
      closedDays: [],
      weeklyInsights: [],

      setUserId: (id) => set({ userId: id }),
      setStats: (stats) => set({ stats }),
      
      addExp: (amount, type, onLevelUp) => {
        const prev = get().stats;
        const newTotalExp = prev.totalExp + amount;
        const newLevel = Math.floor(newTotalExp / EXP_PER_LEVEL) + 1;
        
        const categoryStats = prev[type];
        const newCategoryExp = categoryStats.exp + amount;
        const newCategoryLevel = Math.floor(newCategoryExp / EXP_PER_LEVEL) + 1;

        if (newLevel > prev.level && onLevelUp) {
          onLevelUp(newLevel);
        }

        set({
          stats: {
            ...prev,
            totalExp: newTotalExp,
            level: newLevel,
            [type]: {
              exp: newCategoryExp,
              level: newCategoryLevel
            }
          }
        });
      },

      completeOnboarding: () => set((state) => ({
        stats: { ...state.stats, onboardingCompleted: true }
      })),

      setClosedDays: (closedDays) => set({ closedDays }),
      addClosedDay: (day) => set((state) => ({
        closedDays: [...state.closedDays, day]
      })),

      setWeeklyInsights: (weeklyInsights) => set({ weeklyInsights }),
      addWeeklyInsight: (insight) => set((state) => ({
        weeklyInsights: [{ ...insight, generatedAt: new Date() }, ...state.weeklyInsights]
      })),
    }),
    {
      name: 'iterum_user_storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.closedDays = state.closedDays.map((d: any) => ({
            ...d,
            closedAt: new Date(d.closedAt),
            insight: d.insight ? { ...d.insight, generatedAt: d.insight.generatedAt ? new Date(d.insight.generatedAt) : undefined } : undefined
          }));
          state.weeklyInsights = state.weeklyInsights.map((i: any) => ({
            ...i,
            generatedAt: new Date(i.generatedAt)
          }));
        }
      },
    }
  )
);
