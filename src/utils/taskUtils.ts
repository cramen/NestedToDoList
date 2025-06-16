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

export const getTaskPath = (tasks: Task[], targetId: number): Task[] | null => {
  const task = tasks.find(t => t.id === targetId);
  if (!task) return null;

  const path: Task[] = [task];
  let currentTask = task;

  while (currentTask.parentId) {
    const parentTask = tasks.find(t => t.id === currentTask.parentId);
    if (!parentTask) break;
    path.unshift(parentTask);
    currentTask = parentTask;
  }

  return path;
};

export const getRootTask = (tasks: Task[], taskId: number): Task | null => {
  const path = getTaskPath(tasks, taskId);
  return path ? path[0] : null;
};
