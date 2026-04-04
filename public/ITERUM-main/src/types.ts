export type EntityType = 'task' | 'habit' | 'objective' | 'journal';

export type HabitType = 'yesno' | 'numeric' | 'timer';

export type Habit = {
  id: string;
  name: string;
  description?: string;
  frequency: string; // "daily" | "weekly:Mon,Wed,Fri" | "everyXdays:3"
  type: HabitType;
  targetValue?: number;
  unit?: string;
  category?: string;
  color?: string;
  reminderTime?: string; // HH:mm
  isActive: boolean;
  objectiveIds?: string[]; // Link to objectives
  createdAt: Date;
  archivedAt?: Date;
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  note?: string;
  createdAt: Date;
};

export type Milestone = {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
};

export type Objective = {
  id: string;
  title: string;
  description?: string;
  targetValue: number; // e.g. 100% or 1000km
  currentValue: number;
  unit: string; // e.g. "%", "km", "sesiones"
  deadline?: Date;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  milestones?: Milestone[];
  linkedHabitId?: string;
};

export type Task = {
  id: string;
  type: EntityType;
  title: string;
  description?: string;
  date: Date;
  completed: boolean;
  color?: string;
  migrated?: boolean;
  // Journal specific
  content?: string;
  tags?: string[];
};

export type ViewMode = 'today' | 'week' | 'month' | 'archive' | 'habits' | 'objectives' | 'journal';

export type WeeklyInsight = {
  summary: string;
  patterns: string[];
  tips: string[];
  weeklyWisdom: string;
  stats: {
    completionRate: number;
    mostConsistentHabit: string;
    leastConsistentHabit: string;
  };
  generatedAt?: Date;
};

export type DayClosure = {
  date: string; // YYYY-MM-DD
  summary: string;
  closedAt: Date;
  insight?: WeeklyInsight; // Store the weekly insight if generated this day
};

export type UserStats = {
  discipline: { exp: number; level: number };
  consistency: { exp: number; level: number };
  totalExp: number;
  level: number;
  onboardingCompleted: boolean;
};
