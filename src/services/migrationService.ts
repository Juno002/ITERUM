import { dbService } from './dbService';
import { HabitLog } from '../types';

export const migrationService = {
  async migrateLocalToCloud(userId: string) {
    console.log('Starting migration for user:', userId);

    // 1. Migrate Profile & Stats
    const userStorage = localStorage.getItem('iterum_user_storage');
    if (userStorage) {
      const { state } = JSON.parse(userStorage);
      if (state.stats) {
        await dbService.updateProfile(userId, state.stats);
        console.log('Profile migrated');
      }
    }

    // 2. Migrate Habits
    const habitStorage = localStorage.getItem('iterum_habits_storage');
    if (habitStorage) {
      const { state } = JSON.parse(habitStorage);
      if (state.habits && state.habits.length > 0) {
        for (const habit of state.habits) {
          const { id, createdAt, ...habitData } = habit;
          const newHabit = await dbService.createHabit(userId, habitData);
          
          // Migrate logs for this habit
          if (state.logs) {
            const habitLogs = state.logs.filter((l: HabitLog) => l.habitId === id);
            for (const log of habitLogs) {
              const { id: logId, createdAt: logCreated, ...logData } = log;
              await dbService.upsertHabitLog(userId, { ...logData, habitId: newHabit.id });
            }
          }
        }
        console.log('Habits and logs migrated');
      }
    }

    // 3. Migrate Tasks
    const taskStorage = localStorage.getItem('planner_tasks');
    if (taskStorage) {
      const { state } = JSON.parse(taskStorage);
      if (state.tasks && state.tasks.length > 0) {
        for (const task of state.tasks) {
          const { id, createdAt, ...taskData } = task;
          await dbService.createTask(userId, taskData);
        }
        console.log('Tasks migrated');
      }
    }

    // 4. Migrate Objectives
    const objectiveStorage = localStorage.getItem('iterum_objectives_storage');
    if (objectiveStorage) {
      const { state } = JSON.parse(objectiveStorage);
      if (state.objectives && state.objectives.length > 0) {
        for (const objective of state.objectives) {
          const { id, createdAt, ...objData } = objective;
          await dbService.createObjective(userId, objData);
        }
        console.log('Objectives migrated');
      }
    }

    console.log('Migration completed successfully');
  }
};
