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
    
    // Функция для рекурсивного сбора ID всех подзадач
    const collectSubtaskIds = (parentId: number, ids: Set<number>): void => {
      // Находим все задачи, у которых parentId совпадает с текущим
      const subtasks = tasks.filter(t => t.parentId === parentId);
      
      // Добавляем ID найденных подзадач в набор
      subtasks.forEach(subtask => {
        ids.add(subtask.id);
        // Рекурсивно ищем подзадачи для каждой найденной подзадачи
        collectSubtaskIds(subtask.id, ids);
      });
    };

    // Собираем ID всех подзадач
    const idsToDelete = new Set<number>();
    idsToDelete.add(taskId); // Добавляем ID самой удаляемой задачи
    collectSubtaskIds(taskId, idsToDelete);

    // Удаляем задачу и все её подзадачи
    const filteredTasks = tasks.filter(t => !idsToDelete.has(t.id));
    storageService.saveTasks(filteredTasks);
  },

  // Helper function to generate a unique ID
  generateId: (): number => {
    const tasks = storageService.getAllTasks();
    return Math.max(0, ...tasks.map(t => t.id)) + 1;
  }
}; 