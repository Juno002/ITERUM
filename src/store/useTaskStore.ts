import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Task } from '../types';
import { iterumStateStorage } from '../core/storage/iterumStorage';

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
}

function reviveTask(task: Task): Task {
  return {
    ...task,
    date: new Date(task.date),
    createdAt: new Date(task.createdAt),
  };
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: crypto.randomUUID(),
          completed: false,
          type: task.type || 'task',
          createdAt: new Date(),
        };

        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),
      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task,
          ),
        })),
      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: 'planner_tasks',
      storage: createJSONStorage(() => iterumStateStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.tasks = state.tasks.map(reviveTask);
      },
    },
  ),
);
