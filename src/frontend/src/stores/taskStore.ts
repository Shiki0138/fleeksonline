import { create } from 'zustand';
import { Task, TaskFilters, Comment } from '@/types';
import { tasksApi } from '@/api/tasks';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
  totalTasks: number;
  currentPage: number;
  pageSize: number;
}

interface TaskActions {
  fetchTasks: () => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (data: Omit<Task, 'id' | 'creatorId' | 'creator' | 'project' | 'assignee' | 'comments' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  updateComment: (taskId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setCurrentTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  updateTaskFromSocket: (task: Task) => void;
  addTaskFromSocket: (task: Task) => void;
  removeTaskFromSocket: (taskId: string) => void;
  addCommentFromSocket: (comment: Comment) => void;
}

export const useTaskStore = create<TaskState & TaskActions>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {},
  totalTasks: 0,
  currentPage: 1,
  pageSize: 10,

  fetchTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { filters, currentPage, pageSize } = get();
      const response = await tasksApi.getTasks({
        ...filters,
        page: currentPage,
        pageSize,
      });

      set({
        tasks: response.data || [],
        totalTasks: response.pagination?.total || 0,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch tasks';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchTask: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await tasksApi.getTask(id);
      
      set({
        currentTask: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch task';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createTask: async (data) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await tasksApi.createTask(data);
      const newTask = response.data;

      set((state) => ({
        tasks: [newTask, ...state.tasks],
        totalTasks: state.totalTasks + 1,
        isLoading: false,
      }));

      return newTask;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateTask: async (id: string, data: Partial<Task>) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await tasksApi.updateTask(id, data);
      const updatedTask = response.data;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await tasksApi.deleteTask(id);

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
        totalTasks: state.totalTasks - 1,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  addComment: async (taskId: string, content: string) => {
    try {
      const response = await tasksApi.addComment(taskId, content);
      const newComment = response.data;

      set((state) => ({
        currentTask: state.currentTask?.id === taskId
          ? { ...state.currentTask, comments: [...state.currentTask.comments, newComment] }
          : state.currentTask,
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, comments: [...task.comments, newComment] }
            : task
        ),
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add comment';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateComment: async (taskId: string, commentId: string, content: string) => {
    try {
      const response = await tasksApi.updateComment(taskId, commentId, content);
      const updatedComment = response.data;

      set((state) => ({
        currentTask: state.currentTask?.id === taskId
          ? {
              ...state.currentTask,
              comments: state.currentTask.comments.map((comment) =>
                comment.id === commentId ? updatedComment : comment
              ),
            }
          : state.currentTask,
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                comments: task.comments.map((comment) =>
                  comment.id === commentId ? updatedComment : comment
                ),
              }
            : task
        ),
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update comment';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteComment: async (taskId: string, commentId: string) => {
    try {
      await tasksApi.deleteComment(taskId, commentId);

      set((state) => ({
        currentTask: state.currentTask?.id === taskId
          ? {
              ...state.currentTask,
              comments: state.currentTask.comments.filter((comment) => comment.id !== commentId),
            }
          : state.currentTask,
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                comments: task.comments.filter((comment) => comment.id !== commentId),
              }
            : task
        ),
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete comment';
      set({ error: errorMessage });
      throw error;
    }
  },

  setFilters: (filters: Partial<TaskFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      currentPage: 1, // Reset to first page when filters change
    }));
  },

  setCurrentTask: (task: Task | null) => set({ currentTask: task }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setPage: (page: number) => set({ currentPage: page }),

  // Socket event handlers
  updateTaskFromSocket: (task: Task) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      currentTask: state.currentTask?.id === task.id ? task : state.currentTask,
    }));
  },

  addTaskFromSocket: (task: Task) => {
    set((state) => ({
      tasks: [task, ...state.tasks],
      totalTasks: state.totalTasks + 1,
    }));
  },

  removeTaskFromSocket: (taskId: string) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
      totalTasks: state.totalTasks - 1,
    }));
  },

  addCommentFromSocket: (comment: Comment) => {
    set((state) => ({
      currentTask: state.currentTask?.id === comment.taskId
        ? { ...state.currentTask, comments: [...state.currentTask.comments, comment] }
        : state.currentTask,
      tasks: state.tasks.map((task) =>
        task.id === comment.taskId
          ? { ...task, comments: [...task.comments, comment] }
          : task
      ),
    }));
  },
}));