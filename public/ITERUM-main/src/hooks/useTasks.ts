import { useState, useEffect } from 'react';
import { Task } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('planner_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((t: any) => ({
          ...t,
          date: new Date(t.date),
        }));
      } catch (e) {
        console.error('Failed to parse tasks', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('planner_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      completed: false,
      type: task.type || 'task',
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return { tasks, addTask, updateTask, deleteTask, toggleTask, setTasks };
}
