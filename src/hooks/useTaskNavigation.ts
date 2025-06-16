import { useState, useEffect, useRef } from 'react';
import { Task } from '../types/Task';

// Map of Russian keys to their English equivalents
const RUSSIAN_KEY_MAP: { [key: string]: string } = {
  'ф': 'a', // A
  'и': 'b', // B
  'с': 'c', // C
  'в': 'd', // D
  'у': 'e', // E
  'а': 'f', // F
  'п': 'g', // G
  'р': 'h', // H
  'ш': 'i', // I
  'о': 'j', // J
  'л': 'k', // K
  'д': 'l', // L
  'ь': 'm', // M
  'т': 'n', // N
  'щ': 'o', // O
  'з': 'p', // P
  'й': 'q', // Q
  'к': 'r', // R
  'ы': 's', // S
  'е': 't', // T
  'г': 'u', // U
  'м': 'v', // V
  'ц': 'w', // W
  'ч': 'x', // X
  'н': 'y', // Y
  'я': 'z', // Z
  'Ф': 'A', // A
  'И': 'B', // B
  'С': 'C', // C
  'В': 'D', // D
  'У': 'E', // E
  'А': 'F', // F
  'П': 'G', // G
  'Р': 'H', // H
  'Ш': 'I', // I
  'О': 'J', // J
  'Л': 'K', // K
  'Д': 'L', // L
  'Ь': 'M', // M
  'Т': 'N', // N
  'Щ': 'O', // O
  'З': 'P', // P
  'Й': 'Q', // Q
  'К': 'R', // R
  'Ы': 'S', // S
  'Е': 'T', // T
  'Г': 'U', // U
  'М': 'V', // V
  'Ц': 'W', // W
  'Ч': 'X', // X
  'Н': 'Y', // Y
  'Я': 'Z', // Z
};

// Helper function to get flat list of visible tasks
const getVisibleTasks = (tasks: Task[], expandedTasks: Set<number>): Task[] => {
  const result: Task[] = [];
  
  const traverse = (task: Task) => {
    if (!task) return;
    result.push(task);
    if (Array.isArray(task.children) && task.children.length > 0 && expandedTasks.has(task.id)) {
      task.children.forEach(traverse);
    }
  };

  if (Array.isArray(tasks)) {
    tasks.forEach(traverse);
  }
  return result;
};

// Helper to find parent id in tree
const findParentId = (tasks: Task[], childId: number): number | null => {
  for (const task of tasks) {
    if (task.children && task.children.some(child => child.id === childId)) {
      return task.id;
    }
    if (task.children) {
      const found = findParentId(task.children, childId);
      if (found !== null) return found;
    }
  }
  return null;
};

export function useTaskNavigation(
  tasks: Task[] = [], // Ensure tasks is always an array by defaulting it to an empty array
  options?: {
    onNavigateToParent?: (taskId: number) => void;
    onNavigateToChild?: (taskId: number) => void;
    editingTask?: number | null;
    showNewTaskForm?: boolean;
    showSubtaskForm?: number | null;
    showSiblingForm?: number | null;
    // Новые колбэки для горячих клавиш:
    onToggleComplete?: (task: Task) => void;
    onToggleExpand?: (task: Task) => void;
    onNewTask?: () => void;
    onCreateChild?: (task: Task) => void;
    onCreateSibling?: (task: Task) => void;
    onExpandAll?: () => void;
    onCollapseAll?: () => void;
    onDeleteTask?: (task: Task) => void;
    onStartEdit?: (task: Task) => void;
    expandedTasks?: Set<number>;
    isTreeView?: boolean;
  }
) {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isNavigationActive, setIsNavigationActive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevVisibleTasksRef = useRef<Task[]>([]); // Для отслеживания предыдущего состояния видимых задач
  const prevSelectedTaskIdRef = useRef<number | null>(null); // Для отслеживания предыдущего выбранного ID

  // Get flat list of visible tasks
  const visibleTasks = options?.isTreeView && options?.expandedTasks 
    ? getVisibleTasks(tasks, options.expandedTasks) 
    : tasks;

  // Логика выбора активного элемента при изменении видимых задач
  useEffect(() => {
    const currentSelectedId = selectedTaskId;
    const currentVisibleTasks = visibleTasks;
    const prevVisibleTasks = prevVisibleTasksRef.current;
    const prevSelectedId = prevSelectedTaskIdRef.current;

    // Сохраняем текущее состояние для следующего рендера
    prevVisibleTasksRef.current = currentVisibleTasks;
    prevSelectedTaskIdRef.current = currentSelectedId;

    // Если нет видимых задач, сбрасываем выделение
    if (currentVisibleTasks.length === 0) {
      setSelectedTaskId(null);
      return;
    }

    // Если текущая выбранная задача всё ещё видна, оставляем её
    if (currentSelectedId !== null && currentVisibleTasks.some(t => t.id === currentSelectedId)) {
      return;
    }

    // Если предыдущая выбранная задача была удалена
    if (prevSelectedId !== null && !currentVisibleTasks.some(t => t.id === prevSelectedId)) {
      // Находим удаленную задачу в предыдущем списке
      const deletedTask = prevVisibleTasks.find(t => t.id === prevSelectedId);
      if (!deletedTask) return;

      // Находим все задачи с тем же parentId в текущем списке
      const siblings = currentVisibleTasks.filter(t => t.parentId === deletedTask.parentId);
      
      if (siblings.length > 0) {
        // Берем первую задачу из того же уровня
        setSelectedTaskId(siblings[0].id);
        return;
      }

      // Если нет задач на том же уровне, берем родителя
      if (deletedTask.parentId !== undefined) {
        const parentTask = currentVisibleTasks.find(t => t.id === deletedTask.parentId);
        if (parentTask) {
          setSelectedTaskId(parentTask.id);
          return;
        }
      }

      // Если ничего не нашли, берем первую видимую задачу
      if (currentVisibleTasks.length > 0) {
        setSelectedTaskId(currentVisibleTasks[0].id);
      } else {
        setSelectedTaskId(null);
      }
      return;
    }

    // Если не удалось сохранить позицию и нет выбранной задачи, выбираем первую
    if (currentSelectedId === null && currentVisibleTasks.length > 0) {
      setSelectedTaskId(currentVisibleTasks[0].id);
    }
  }, [visibleTasks, selectedTaskId, tasks]);

  // Обработка навигации клавиатурой
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверяем, что фокус не находится в поле ввода
      const activeElement = document.activeElement;
      const isInputField = activeElement instanceof HTMLInputElement || 
                          activeElement instanceof HTMLTextAreaElement;
      
      if (isInputField) {
        return; // Игнорируем горячие клавиши, если фокус в поле ввода
      }

      if (
        options?.editingTask !== null ||
        options?.showNewTaskForm ||
        options?.showSubtaskForm !== null ||
        options?.showSiblingForm !== null
      ) {
        return;
      }
      if (!isNavigationActive) return;

      // Convert Russian key to English if needed
      const key = RUSSIAN_KEY_MAP[e.key] || e.key;

      // Handle 'N' key specifically, regardless of whether there are visible tasks
      if (key === 'n' || key === 'N' || key === 'т' || key === 'Т') {
        e.preventDefault();
        if (options?.onNewTask) {
          options.onNewTask();
        }
        return; // Important: return after handling 'N' to prevent further processing
      }

      // For all other keys, require visible tasks
      if (visibleTasks.length === 0) return;

      const currentIndex = visibleTasks.findIndex(t => t.id === selectedTaskId);
      const selectedTask = currentIndex >= 0 ? visibleTasks[currentIndex] : null;
      const expandedTasks = options?.expandedTasks;

      switch (key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedTaskId(visibleTasks[currentIndex - 1].id);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < visibleTasks.length - 1) {
            setSelectedTaskId(visibleTasks[currentIndex + 1].id);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (
            selectedTask &&
            expandedTasks &&
            expandedTasks.has(selectedTask.id) &&
            selectedTask.children &&
            selectedTask.children.length > 0 &&
            options?.onToggleExpand
          ) {
            // Если раскрыта — свернуть
            options.onToggleExpand(selectedTask);
          } else if (selectedTask) {
            // Переместить фокус на родителя
            const parentId = findParentId(tasks, selectedTask.id);
            if (parentId !== null) {
              setSelectedTaskId(parentId);
            } else if (options?.onNavigateToParent) {
              options.onNavigateToParent(selectedTask.id);
            }
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (
            selectedTask &&
            selectedTask.children &&
            selectedTask.children.length > 0 &&
            expandedTasks &&
            !expandedTasks.has(selectedTask.id) &&
            options?.onToggleExpand
          ) {
            // Если есть дети и свернута — развернуть
            options.onToggleExpand(selectedTask);
          } else if (selectedTask && options?.onNavigateToChild) {
            // Иначе к ребенку
            options.onNavigateToChild(selectedTask.id);
          }
          break;
        case ' ': // Space
          e.preventDefault();
          if (selectedTask && options?.onToggleExpand) {
            options.onToggleExpand(selectedTask);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedTask && options?.onToggleComplete) {
            options.onToggleComplete(selectedTask);
          }
          break;
        case 'c':
        case 'C':
        case 'с': // Russian 'c'
        case 'С': // Russian 'C'
          e.preventDefault();
          if (selectedTask && options?.onCreateChild) {
            options.onCreateChild(selectedTask);
          }
          break;
        case 's':
        case 'S':
        case 'ы': // Russian 's'
        case 'Ы': // Russian 'S'
          e.preventDefault();
          if (selectedTask && options?.onCreateSibling) {
            options.onCreateSibling(selectedTask);
          }
          break;
        case 'x':
        case 'X':
        case 'ч': // Russian 'x'
        case 'Ч': // Russian 'X'
          e.preventDefault();
          if (options?.onExpandAll) {
            options.onExpandAll();
          }
          break;
        case 'z':
        case 'Z':
        case 'я': // Russian 'z'
        case 'Я': // Russian 'Z'
          e.preventDefault();
          if (options?.onCollapseAll) {
            options.onCollapseAll();
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (selectedTask && options?.onDeleteTask) {
            options.onDeleteTask(selectedTask);
          }
          break;
        case 'e':
        case 'E':
        case 'у': // Russian 'e'
        case 'У': // Russian 'E'
          e.preventDefault();
          if (selectedTask && options?.onStartEdit) {
            options.onStartEdit(selectedTask);
          }
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visibleTasks, selectedTaskId, isNavigationActive, options, tasks]);

  return {
    selectedTaskId,
    setSelectedTaskId,
    isNavigationActive,
    setIsNavigationActive,
    containerRef,
  };
} 