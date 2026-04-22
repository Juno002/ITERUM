import type { StateStorage } from 'zustand/middleware';
import type {
  DayClosure,
  Habit,
  HabitLog,
  JournalEntry,
  Objective,
  Task,
  AppStats,
  WeeklyInsight,
} from '../../types';

const STORAGE_KEYS = {
  tasks: 'planner_tasks',
  habits: 'iterum_habits_storage',
  objectives: 'iterum_objectives_v1',
  journals: 'iterum_journals_v1',
  appStats: 'iterum_app_stats_storage',
} as const;

const DEFAULT_APP_STATS: AppStatsState = {
  stats: {
    discipline: { exp: 0, level: 1 },
    consistency: { exp: 0, level: 1 },
    totalExp: 0,
    level: 1,
    onboardingCompleted: false,
  },
  closedDays: [],
  weeklyInsights: [],
};

type PersistEnvelope<T> = {
  state: T;
  version: number;
};

type AppStatsState = {
  stats: AppStats;
  closedDays: DayClosure[];
  weeklyInsights: WeeklyInsight[];
};

export interface IterumStorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
  readTasks(): Task[] | Promise<Task[]>;
  writeTasks(tasks: Task[]): void | Promise<void>;
  readHabits(): Habit[] | Promise<Habit[]>;
  writeHabits(habits: Habit[]): void | Promise<void>;
  readHabitLogs(): HabitLog[] | Promise<HabitLog[]>;
  writeHabitLogs(logs: HabitLog[]): void | Promise<void>;
  readObjectives(): Objective[] | Promise<Objective[]>;
  writeObjectives(objectives: Objective[]): void | Promise<void>;
  readJournals(): JournalEntry[] | Promise<JournalEntry[]>;
  writeJournals(journals: JournalEntry[]): void | Promise<void>;
  readStats(): AppStatsState | Promise<AppStatsState>;
  writeStats(stats: AppStatsState): void | Promise<void>;
}

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function resolveStorage(): Storage {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return createMemoryStorage();
}

function parseEnvelope<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as PersistEnvelope<T>;
    return parsed.state ?? fallback;
  } catch {
    return fallback;
  }
}

function serializeEnvelope<T>(state: T): string {
  return JSON.stringify({ state, version: 0 } satisfies PersistEnvelope<T>);
}

function createEntityReader<T, R>(storage: Storage, key: string, selector: (state: T) => R): () => R {
  return () => {
    const envelope = parseEnvelope<T | Record<string, never>>(storage.getItem(key), {});
    return selector(envelope as T);
  };
}

function reviveTask(task: Task): Task {
  return {
    ...task,
    date: new Date(task.date),
    createdAt: new Date(task.createdAt),
  };
}

function reviveHabit(habit: Habit): Habit {
  return {
    ...habit,
    createdAt: new Date(habit.createdAt),
    archivedAt: habit.archivedAt ? new Date(habit.archivedAt) : undefined,
  };
}

function reviveHabitLog(log: HabitLog): HabitLog {
  return {
    ...log,
    createdAt: new Date(log.createdAt),
  };
}

function reviveObjective(objective: Objective): Objective {
  return {
    ...objective,
    createdAt: new Date(objective.createdAt),
    deadline: objective.deadline ? new Date(objective.deadline) : undefined,
    milestones: objective.milestones?.map((milestone) => ({
      ...milestone,
      completedAt: milestone.completedAt ? new Date(milestone.completedAt) : undefined,
    })),
  };
}

function reviveStats(state: AppStatsState): AppStatsState {
  return {
    ...state,
    closedDays: (state.closedDays ?? []).map((day) => ({
      ...day,
      closedAt: new Date(day.closedAt),
      insight: day.insight
        ? {
            ...day.insight,
            generatedAt: day.insight.generatedAt ? new Date(day.insight.generatedAt) : undefined,
          }
        : undefined,
    })),
    weeklyInsights: (state.weeklyInsights ?? []).map((insight) => ({
      ...insight,
      generatedAt: insight.generatedAt ? new Date(insight.generatedAt) : undefined,
    })),
  };
}

export function createLocalStorageAdapter(): IterumStorageAdapter {
  const storage = resolveStorage();

  const readTasks = createEntityReader<{ tasks: Task[] }, Task[]>(
    storage,
    STORAGE_KEYS.tasks,
    (state) => (state.tasks ?? []).map(reviveTask),
  );
  const readHabitsState = createEntityReader<
    { habits: Habit[]; logs: HabitLog[] },
    { habits?: Habit[]; logs?: HabitLog[] }
  >(
    storage,
    STORAGE_KEYS.habits,
    (state) => state,
  );
  const readObjectives = createEntityReader<{ objectives: Objective[] }, Objective[]>(
    storage,
    STORAGE_KEYS.objectives,
    (state) => (state.objectives ?? []).map(reviveObjective),
  );
  const readJournals = createEntityReader<{ journals: JournalEntry[] }, JournalEntry[]>(
    storage,
    STORAGE_KEYS.journals,
    (state) => state.journals ?? [],
  );
  const readStats = createEntityReader<AppStatsState, AppStatsState>(storage, STORAGE_KEYS.appStats, reviveStats);

  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
    readTasks: () => readTasks(),
    writeTasks: (tasks) => storage.setItem(STORAGE_KEYS.tasks, serializeEnvelope({ tasks })),
    readHabits: () => (((readHabitsState() as { habits?: Habit[] }).habits ?? []).map(reviveHabit)),
    writeHabits: (habits) => {
      const current = parseEnvelope<{ habits: Habit[]; logs: HabitLog[] }>(storage.getItem(STORAGE_KEYS.habits), {
        habits: [],
        logs: [],
      });
      storage.setItem(STORAGE_KEYS.habits, serializeEnvelope({ ...current, habits }));
    },
    readHabitLogs: () =>
      (((readHabitsState() as { logs?: HabitLog[] }).logs ?? []).map(reviveHabitLog)),
    writeHabitLogs: (logs) => {
      const current = parseEnvelope<{ habits: Habit[]; logs: HabitLog[] }>(storage.getItem(STORAGE_KEYS.habits), {
        habits: [],
        logs: [],
      });
      storage.setItem(STORAGE_KEYS.habits, serializeEnvelope({ ...current, logs }));
    },
    readObjectives: () => readObjectives(),
    writeObjectives: (objectives) =>
      storage.setItem(STORAGE_KEYS.objectives, serializeEnvelope({ objectives })),
    readJournals: () => readJournals(),
    writeJournals: (journals) => storage.setItem(STORAGE_KEYS.journals, serializeEnvelope({ journals })),
    readStats: () => {
      const statsState = readStats();
      return statsState.stats ? statsState : DEFAULT_APP_STATS;
    },
    writeStats: (stats) => storage.setItem(STORAGE_KEYS.appStats, serializeEnvelope(stats)),
  };
}

let activeAdapter: IterumStorageAdapter = createLocalStorageAdapter();

export function setIterumStorageAdapter(adapter: IterumStorageAdapter) {
  activeAdapter = adapter;
}

export function getIterumStorageAdapter() {
  return activeAdapter;
}

export const iterumStateStorage: StateStorage = {
  getItem: (name) => activeAdapter.getItem(name) as string | null,
  setItem: (name, value) => {
    void activeAdapter.setItem(name, value);
  },
  removeItem: (name) => {
    void activeAdapter.removeItem(name);
  },
};

export type { AppStatsState };
