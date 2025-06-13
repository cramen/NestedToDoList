import { Task } from '../types/Task';

const STORAGE_KEY = 'tasks';

export const storageService = {
  getAllTasks: (): Task[] => {
    const tasks = localStorage.getItem(STORAGE_KEY);
    return tasks ? JSON.parse(tasks) : [];
  },

  saveTasks: (tasks: Task[]): void => {
    console.log('Saving tasks to localStorage:', tasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  },

  addTask: (task: Task): void => {
    console.log('Adding task to localStorage:', task);
    const tasks = storageService.getAllTasks();
    tasks.push(task);
    storageService.saveTasks(tasks);
  },

  updateTask: (updatedTask: Task): void => {
    const tasks = storageService.getAllTasks();
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      storageService.saveTasks(tasks);
    }
  },

  deleteTask: (taskId: number): void => {
    const tasks = storageService.getAllTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    storageService.saveTasks(filteredTasks);
  },

  // Helper function to generate a unique ID
  generateId: (): number => {
    const tasks = storageService.getAllTasks();
    return Math.max(0, ...tasks.map(t => t.id)) + 1;
  }
}; 