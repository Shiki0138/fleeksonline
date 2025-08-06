import { create } from 'zustand';
import { Project, ProjectFilters } from '@/types';
import { projectsApi } from '@/api/projects';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  filters: ProjectFilters;
  totalProjects: number;
  currentPage: number;
  pageSize: number;
}

interface ProjectActions {
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: Omit<Project, 'id' | 'ownerId' | 'members' | 'tasksCount' | 'completedTasksCount' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMember: (projectId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  updateMemberRole: (projectId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
}

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  filters: {},
  totalProjects: 0,
  currentPage: 1,
  pageSize: 10,

  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { filters, currentPage, pageSize } = get();
      const response = await projectsApi.getProjects({
        ...filters,
        page: currentPage,
        pageSize,
      });

      set({
        projects: response.data || [],
        totalProjects: response.pagination?.total || 0,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch projects';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchProject: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await projectsApi.getProject(id);
      
      set({
        currentProject: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch project';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createProject: async (data) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await projectsApi.createProject(data);
      const newProject = response.data;

      set((state) => ({
        projects: [newProject, ...state.projects],
        totalProjects: state.totalProjects + 1,
        isLoading: false,
      }));

      return newProject;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await projectsApi.updateProject(id, data);
      const updatedProject = response.data;

      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id ? updatedProject : project
        ),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await projectsApi.deleteProject(id);

      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        totalProjects: state.totalProjects - 1,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  addMember: async (projectId: string, userId: string, role: 'admin' | 'member') => {
    try {
      const response = await projectsApi.addMember(projectId, { userId, role });
      const updatedProject = response.data;

      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === projectId ? updatedProject : project
        ),
        currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add member';
      set({ error: errorMessage });
      throw error;
    }
  },

  removeMember: async (projectId: string, userId: string) => {
    try {
      const response = await projectsApi.removeMember(projectId, userId);
      const updatedProject = response.data;

      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === projectId ? updatedProject : project
        ),
        currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove member';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateMemberRole: async (projectId: string, userId: string, role: 'admin' | 'member') => {
    try {
      const response = await projectsApi.updateMemberRole(projectId, userId, role);
      const updatedProject = response.data;

      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === projectId ? updatedProject : project
        ),
        currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update member role';
      set({ error: errorMessage });
      throw error;
    }
  },

  setFilters: (filters: Partial<ProjectFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      currentPage: 1, // Reset to first page when filters change
    }));
  },

  setCurrentProject: (project: Project | null) => set({ currentProject: project }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setPage: (page: number) => set({ currentPage: page }),
}));