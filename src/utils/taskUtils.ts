import { Task } from '../types/Task';

export const findTaskById = (tasks: Task[], id: number): Task | null => {
  for (const task of tasks) {
    if (task.id === id) {
      return task;
    }
    const foundInChildren = findTaskById(task.children, id);
    if (foundInChildren) {
      return foundInChildren;
    }
  }
  return null;
};

export const getTaskDepth = (tasks: Task[], taskId: number, currentDepth = 0): number => {
  for (const task of tasks) {
    if (task.id === taskId) {
      return currentDepth;
    }
    const depthInChildren = getTaskDepth(task.children, taskId, currentDepth + 1);
    if (depthInChildren > -1) {
      return depthInChildren;
    }
  }
  return -1;
};

export const getAllTaskIds = (tasks: Task[]): number[] => {
  const ids: number[] = [];
  const collectIds = (taskList: Task[]) => {
    taskList.forEach(task => {
      ids.push(task.id);
      collectIds(task.children);
    });
  };
  collectIds(tasks);
  return ids;
};

export const getTaskPath = (tasks: Task[], targetId: number, currentPath: Task[] = []): Task[] | null => {
  for (const task of tasks) {
    const newPath = [...currentPath, task];
    if (task.id === targetId) {
      return newPath;
    }
    if (task.children && task.children.length > 0) {
      const pathInChildren = getTaskPath(task.children, targetId, newPath);
      if (pathInChildren) {
        return pathInChildren;
      }
    }
  }
  return null;
};

export const getRootTask = (tasks: Task[], taskId: number): Task | null => {
  const path = getTaskPath(tasks, taskId);
  return path ? path[0] : null;
};
