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
    console.log('--- useTaskNavigation useEffect triggered ---');
    console.log('Initial selectedTaskId:', selectedTaskId);
    console.log('Initial visibleTasks length:', visibleTasks.length);

    const currentSelectedId = selectedTaskId;
    const currentVisibleTasks = visibleTasks;
    const prevVisibleTasks = prevVisibleTasksRef.current;
    const prevSelectedId = prevSelectedTaskIdRef.current;

    console.log('prevSelectedId:', prevSelectedId);
    console.log('prevVisibleTasks length:', prevVisibleTasks.length);
    console.log('currentSelectedId (before update logic):', currentSelectedId);
    console.log('currentVisibleTasks length (before update logic):', currentVisibleTasks.length);

    // Сохраняем текущее состояние для следующего рендера
    prevVisibleTasksRef.current = currentVisibleTasks;
    prevSelectedTaskIdRef.current = currentSelectedId;

    // Если нет видимых задач, сбрасываем выделение
    if (currentVisibleTasks.length === 0) {
      console.log('No visible tasks, setting selectedTaskId to null.');
      setSelectedTaskId(null);
      return;
    }

    // Если текущая выбранная задача всё ещё видна, оставляем её
    if (currentSelectedId !== null && currentVisibleTasks.some(t => t.id === currentSelectedId)) {
      console.log('Current selected task is still visible, keeping it.');
      return;
    }

    // Если предыдущая выбранная задача была удалена (или стала невидимой)
    if (prevSelectedId !== null && !currentVisibleTasks.some(t => t.id === prevSelectedId)) {
      console.log('Previous selected task is no longer visible. Initiating fallback logic.');

      // 1. Попытаться найти родителя предыдущей выбранной задачи
      const prevSelectedTask = tasks.find(t => t.id === prevSelectedId);
      if (prevSelectedTask && prevSelectedTask.parentId !== undefined) {
        const parentOfPrevSelected = currentVisibleTasks.find(t => t.id === prevSelectedTask.parentId);
        if (parentOfPrevSelected) {
          console.log('Found parent in current visible tasks, setting selectedTaskId to parent:', parentOfPrevSelected.id);
          setSelectedTaskId(parentOfPrevSelected.id);
          return;
        } else {
          console.log('Parent not found or not visible in current visible tasks.');
        }
      } else {
        console.log('Previous selected task had no parent or was not found in full tasks list.');
      }

      // 2. Если родитель не найден или не является видимым, вернуться к выбору следующей/предыдущей видимой задачи по индексу
      const prevIndex = prevVisibleTasks.findIndex(t => t.id === prevSelectedId);
      console.log('prevIndex:', prevIndex);

      // Try the same index in the new list
      if (prevIndex !== -1 && prevIndex < currentVisibleTasks.length) {
        console.log('Attempting to set selectedTaskId to same index:', currentVisibleTasks[prevIndex].id);
        setSelectedTaskId(currentVisibleTasks[prevIndex].id);
        return;
      }
      
      // Try the previous index in the new list
      if (prevIndex > 0 && currentVisibleTasks.length > 0) {
        const newId = currentVisibleTasks[Math.min(prevIndex - 1, currentVisibleTasks.length - 1)].id;
        console.log('Attempting to set selectedTaskId to previous index:', newId);
        setSelectedTaskId(newId);
        return;
      }

      // Try the next index in the new list
      if (currentVisibleTasks.length > 0 && prevIndex !== -1 && prevIndex + 1 < currentVisibleTasks.length) {
        const newId = currentVisibleTasks[prevIndex + 1].id;
        console.log('Attempting to set selectedTaskId to next index:', newId);
        setSelectedTaskId(newId);
        return;
      }

      // 3. Если ни один из вариантов не сработал, выбираем первый видимый элемент (или null, если список пуст).
      if (currentVisibleTasks.length > 0) {
        console.log('Fallback: Setting selectedTaskId to first visible task:', currentVisibleTasks[0].id);
        setSelectedTaskId(currentVisibleTasks[0].id);
      } else {
        console.log('Fallback: No visible tasks, setting selectedTaskId to null.');
        setSelectedTaskId(null); 
      }
      return; // Важно: вернуться после обработки, чтобы избежать дальнейшей логики
    }

    // Если не удалось сохранить позицию и нет выбранной задачи, выбираем первую (этот блок теперь дублирует часть выше, но пусть останется как запасной вариант, если prevSelectedId был null изначально)
    if (currentSelectedId === null && currentVisibleTasks.length > 0) {
      console.log('No selected task initially, setting selectedTaskId to first visible task:', currentVisibleTasks[0].id);
      setSelectedTaskId(currentVisibleTasks[0].id);
    }

    // Final check
    console.log('Final selectedTaskId after useEffect:', selectedTaskId);
    if (selectedTaskId !== null && !currentVisibleTasks.some(t => t.id === selectedTaskId)) {
      console.error('ERROR: selectedTaskId is not in currentVisibleTasks after useEffect!', selectedTaskId);
    }
    console.log('--- useTaskNavigation useEffect end ---');
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