import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AppStats, DayClosure, WeeklyInsight } from '../types';
import { iterumStateStorage } from '../core/storage/iterumStorage';

interface AppStatsState {
  stats: AppStats;
  closedDays: DayClosure[];
  weeklyInsights: WeeklyInsight[];
  setStats: (stats: AppStats) => void;
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

const defaultStats: AppStats = {
  discipline: { exp: 0, level: 1 },
  consistency: { exp: 0, level: 1 },
  totalExp: 0,
  level: 1,
  onboardingCompleted: false,
};

function reviveClosedDays(closedDays: DayClosure[]) {
  return closedDays.map((day) => ({
    ...day,
    closedAt: new Date(day.closedAt),
    insight: day.insight
      ? {
          ...day.insight,
          generatedAt: day.insight.generatedAt ? new Date(day.insight.generatedAt) : undefined,
        }
      : undefined,
  }));
}

function reviveWeeklyInsights(weeklyInsights: WeeklyInsight[]) {
  return weeklyInsights.map((insight) => ({
    ...insight,
    generatedAt: insight.generatedAt ? new Date(insight.generatedAt) : undefined,
  }));
}

export const useAppStatsStore = create<AppStatsState>()(
  persist(
    (set, get) => ({
      stats: defaultStats,
      closedDays: [],
      weeklyInsights: [],

      setStats: (stats) => set({ stats }),

      addExp: (amount, type, onLevelUp) => {
        const { stats } = get();
        const newTotalExp = stats.totalExp + amount;
        const newLevel = Math.floor(newTotalExp / EXP_PER_LEVEL) + 1;
        const categoryStats = stats[type];
        const newCategoryExp = categoryStats.exp + amount;
        const newCategoryLevel = Math.floor(newCategoryExp / EXP_PER_LEVEL) + 1;

        if (newLevel > stats.level) {
          onLevelUp?.(newLevel);
        }

        set({
          stats: {
            ...stats,
            totalExp: newTotalExp,
            level: newLevel,
            [type]: {
              exp: newCategoryExp,
              level: newCategoryLevel,
            },
          },
        });
      },

      completeOnboarding: () =>
        set((state) => ({
          stats: {
            ...state.stats,
            onboardingCompleted: true,
          },
        })),

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
      name: 'iterum_app_stats_storage',
      storage: createJSONStorage(() => iterumStateStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.closedDays = reviveClosedDays(state.closedDays);
        state.weeklyInsights = reviveWeeklyInsights(state.weeklyInsights);
      },
    },
  ),
);
