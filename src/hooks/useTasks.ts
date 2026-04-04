import { useTaskStore } from '../store/useTaskStore';

export function useTasks() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask, setTasks, loadTasks } = useTaskStore();
  return { tasks, addTask, updateTask, deleteTask, toggleTask, setTasks, loadTasks };
}
