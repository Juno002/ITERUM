import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Task } from '../types';

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
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
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },
      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
      },
      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: 'planner_tasks',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.tasks = state.tasks.map((t: any) => ({
            ...t,
            date: new Date(t.date),
          }));
        }
      },
    }
  )
);
