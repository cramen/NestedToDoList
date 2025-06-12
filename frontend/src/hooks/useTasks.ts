import { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/Task';
import { taskApi } from '../services/api';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deepestTasks, setDeepestTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskApi.getAllTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeepestTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskApi.getDeepestTasks();
      setDeepestTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deepest tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData: CreateTaskRequest) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.createTask(taskData);
      await fetchAllTasks();
      await fetchDeepestTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAllTasks, fetchDeepestTasks]);

  const createSiblingTask = useCallback(async (taskId: number, taskData: CreateTaskRequest) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.createSiblingTask(taskId, taskData);
      await fetchAllTasks();
      await fetchDeepestTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sibling task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAllTasks, fetchDeepestTasks]);

  const updateTask = useCallback(async (id: number, updates: UpdateTaskRequest) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.updateTask(id, updates);
      await fetchAllTasks();
      await fetchDeepestTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAllTasks, fetchDeepestTasks]);

  const deleteTask = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.deleteTask(id);
      await fetchAllTasks();
      await fetchDeepestTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAllTasks, fetchDeepestTasks]);

  useEffect(() => {
    fetchAllTasks();
    fetchDeepestTasks();
  }, [fetchAllTasks, fetchDeepestTasks]);

  return {
    tasks,
    deepestTasks,
    loading,
    error,
    fetchAllTasks,
    fetchDeepestTasks,
    createTask,
    createSiblingTask,
    updateTask,
    deleteTask,
  };
};
