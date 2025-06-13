import { useState, useEffect } from 'react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/Task';
import { storageService } from '../services/storage';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deepestTasks, setDeepestTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to find deepest tasks
  const findDeepestTasks = (allTasks: Task[]): Task[] => {
    const taskMap = new Map<number, Task>();
    const rootTasks: Task[] = [];

    // First, create a map of all tasks with their children initialized
    allTasks.forEach(task => taskMap.set(task.id, { ...task, children: [] }));

    // Then, build the tree structure
    allTasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id)!;
      if (task.parentId === undefined) {
        rootTasks.push(taskWithChildren);
      } else {
        const parent = taskMap.get(task.parentId);
        if (parent) {
          parent.children.push(taskWithChildren);
        }
      }
    });

    const deepestUncompleted: Task[] = [];

    const traverse = (task: Task) => {
      if (task.isCompleted) {
        return; // If the task itself is completed, ignore it and its subtasks
      }

      const hasUncompletedChildren = task.children.some(child => !child.isCompleted);

      if (!hasUncompletedChildren) {
        // This task is uncompleted, and all its children are completed (or it has no children).
        deepestUncompleted.push(task);
      } else {
        // This task has uncompleted children, so recurse into them.
        task.children.forEach(traverse);
      }
    };

    rootTasks.forEach(traverse);
    return deepestUncompleted;
  };

  // Helper function to build task tree
  const buildTaskTree = (allTasks: Task[]): Task[] => {
    const taskMap = new Map<number, Task>();
    const rootTasks: Task[] = [];

    // First, create a map of all tasks
    allTasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    // Then, build the tree structure
    allTasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id)!;
      if (task.parentId === undefined) {
        rootTasks.push(taskWithChildren);
      } else {
        const parent = taskMap.get(task.parentId);
        if (parent) {
          parent.children.push(taskWithChildren);
        }
      }
    });

    return rootTasks;
  };

  // Load tasks on mount
  useEffect(() => {
    try {
      const loadedTasks = storageService.getAllTasks();
      console.log('Loaded tasks from localStorage:', loadedTasks);
      const taskTree = buildTaskTree(loadedTasks);
      setTasks(taskTree);
      setDeepestTasks(findDeepestTasks(loadedTasks));
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    }
  }, []);

  const createTask = async (task: CreateTaskRequest): Promise<Task> => {
    setLoading(true);
    try {
      const newTask: Task = {
        id: storageService.generateId(),
        title: task.title,
        description: task.description || '',
        isCompleted: false,
        parentId: task.parentId,
        position: task.position || 0,
        children: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      storageService.addTask(newTask);

      // If a new subtask is created, ensure all its parents are also uncompleted.
      if (newTask.parentId !== undefined) {
        let currentParentId: number | undefined = newTask.parentId;
        let currentAllTasks = storageService.getAllTasks(); // Re-fetch to ensure latest state
        while (currentParentId !== undefined) {
          const parentTask = currentAllTasks.find(t => t.id === currentParentId);
          if (parentTask && parentTask.isCompleted) {
            const updatedParent = { ...parentTask, isCompleted: false, updatedAt: new Date().toISOString() };
            storageService.updateTask(updatedParent);
            currentParentId = updatedParent.parentId;
            currentAllTasks = storageService.getAllTasks(); // Re-fetch after updating a parent
          } else {
            break; // Stop if parent is already uncompleted or not found
          }
        }
      }

      const allTasks = storageService.getAllTasks();
      const taskTree = buildTaskTree(allTasks);
      setTasks(taskTree);
      setDeepestTasks(findDeepestTasks(allTasks));
      return newTask;
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: number, updates: UpdateTaskRequest): Promise<Task> => {
    setLoading(true);
    try {
      const allTasks = storageService.getAllTasks();
      const taskToUpdate = allTasks.find(t => t.id === taskId);
      if (!taskToUpdate) {
        throw new Error('Task not found');
      }

      const updatedTask: Task = {
        ...taskToUpdate,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      storageService.updateTask(updatedTask);

      // Re-fetch all tasks and rebuild the tree to get the most current relationships
      // This is crucial because `updatedTask`'s children might not be current without this.
      let currentAllTasks = storageService.getAllTasks(); // Get the latest flat list
      const currentTaskTree = buildTaskTree(currentAllTasks); // Build the tree with correct children

      // Helper to find a task in the tree based on its ID
      const findTaskInTreeRecursive = (tasksArray: Task[], id: number): Task | undefined => {
        for (const t of tasksArray) {
          if (t.id === id) return t;
          if (t.children && t.children.length > 0) {
            const found = findTaskInTreeRecursive(t.children, id);
            if (found) return found;
          }
        }
        return undefined;
      };

      const targetTaskInTree = findTaskInTreeRecursive(currentTaskTree, taskId);

      if (!targetTaskInTree) {
          // This should ideally not happen if task was found initially
          throw new Error('Target task not found in the updated task tree.');
      }

      // If a task is marked as completed, ensure all its subtasks are also completed.
      if (updatedTask.isCompleted === true) {
        const cascadeCompleteChildren = (task: Task) => {
          task.children.forEach(child => {
            if (!child.isCompleted) { // Only update if not already completed
              const updatedChild = { ...child, isCompleted: true, updatedAt: new Date().toISOString() };
              storageService.updateTask(updatedChild);
              // Recursively call on the updated child (from the current tree context)
              cascadeCompleteChildren(updatedChild);
            }
          });
        };
        cascadeCompleteChildren(targetTaskInTree); // Start recursion from the task in the tree
      }

      // If a task is marked as uncompleted, ensure all its parents are also uncompleted.
      if (updatedTask.isCompleted === false) {
        let currentParentId: number | undefined = updatedTask.parentId;
        // Re-fetch here to ensure the latest state for parent chain check
        currentAllTasks = storageService.getAllTasks(); // Get the latest flat list after potential child updates
        while (currentParentId !== undefined) {
          const parentTask = currentAllTasks.find(t => t.id === currentParentId);
          if (parentTask && parentTask.isCompleted) {
            const updatedParent = { ...parentTask, isCompleted: false, updatedAt: new Date().toISOString() };
            storageService.updateTask(updatedParent);
            currentParentId = updatedParent.parentId;
            currentAllTasks = storageService.getAllTasks(); // Re-fetch after updating a parent
          } else {
            break; // Stop if parent is already uncompleted or not found
          }
        }
      }

      const finalAllTasks = storageService.getAllTasks();
      const finalTaskTree = buildTaskTree(finalAllTasks);
      setTasks(finalTaskTree);
      setDeepestTasks(findDeepestTasks(finalAllTasks));
      return updatedTask;
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: number): Promise<void> => {
    setLoading(true);
    try {
      storageService.deleteTask(taskId);
      const allTasks = storageService.getAllTasks();
      const taskTree = buildTaskTree(allTasks);
      setTasks(taskTree);
      setDeepestTasks(findDeepestTasks(allTasks));
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSiblingTask = async (taskId: number, task: CreateTaskRequest): Promise<Task> => {
    const allTasks = storageService.getAllTasks();
    const parentTask = allTasks.find(t => t.id === taskId);
    if (!parentTask) {
      throw new Error('Parent task not found');
    }
    return createTask({ ...task, parentId: parentTask.parentId });
  };

  const createSubtask = async (parentId: number, task: CreateTaskRequest): Promise<Task> => {
    return createTask({ ...task, parentId });
  };

  return {
    tasks,
    deepestTasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    createSiblingTask,
    createSubtask
  };
};
