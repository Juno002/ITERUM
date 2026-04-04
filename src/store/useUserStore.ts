import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserStats, DayClosure, WeeklyInsight } from '../types';
import { dbService } from '../services/dbService';

interface UserState {
  userId: string | null;
  stats: UserStats;
  closedDays: DayClosure[];
  weeklyInsights: WeeklyInsight[];
  setUserId: (id: string | null) => void;
  setStats: (stats: UserStats) => void;
  loadProfile: (userId: string) => Promise<void>;
  addExp: (
    amount: number,
    type: 'discipline' | 'consistency',
    onLevelUp?: (level: number) => void,
  ) => void;
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
      userId: null,
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

      loadProfile: async (userId) => {
        try {
          const profile = await dbService.getProfile(userId);
          if (profile) {
            set({
              userId,
              stats: {
                discipline: { exp: profile.discipline_exp, level: profile.discipline_level },
                consistency: { exp: profile.consistency_exp, level: profile.consistency_level },
                totalExp: profile.total_exp,
                level: profile.level,
                onboardingCompleted: profile.onboarding_completed,
              },
            });
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      },

      addExp: (amount, type, onLevelUp) => {
        const { stats, userId } = get();
        const newTotalExp = stats.totalExp + amount;
        const newLevel = Math.floor(newTotalExp / EXP_PER_LEVEL) + 1;

        const categoryStats = stats[type];
        const newCategoryExp = categoryStats.exp + amount;
        const newCategoryLevel = Math.floor(newCategoryExp / EXP_PER_LEVEL) + 1;

        if (newLevel > stats.level && onLevelUp) {
          onLevelUp(newLevel);
        }

        const newStats = {
          ...stats,
          totalExp: newTotalExp,
          level: newLevel,
          [type]: {
            exp: newCategoryExp,
            level: newCategoryLevel,
          },
        };

        set({ stats: newStats });

        if (userId) {
          dbService.updateProfile(userId, newStats).catch(console.error);
        }
      },

      completeOnboarding: () => {
        const { stats, userId } = get();
        const newStats = { ...stats, onboardingCompleted: true };
        set({ stats: newStats });
        if (userId) {
          dbService.updateProfile(userId, newStats).catch(console.error);
        }
      },

      setClosedDays: (closedDays) => set({ closedDays }),
      addClosedDay: (day) =>
        set((state) => ({
          closedDays: [...state.closedDays, day],
        })),

      setWeeklyInsights: (weeklyInsights) => set({ weeklyInsights }),
      addWeeklyInsight: (insight) =>
        set((state) => ({
          weeklyInsights: [{ ...insight, generatedAt: new Date() }, ...state.weeklyInsights],
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
            insight: d.insight
              ? {
                  ...d.insight,
                  generatedAt: d.insight.generatedAt ? new Date(d.insight.generatedAt) : undefined,
                }
              : undefined,
          }));
          state.weeklyInsights = state.weeklyInsights.map((i: any) => ({
            ...i,
            generatedAt: new Date(i.generatedAt),
          }));
        }
      },
    },
  ),
);
