import api from './api';
import { Project, APIResponse, Pagination } from '../types/index';

export const projectService = {
  getProjects: async (filters: Record<string, any> = {}, pagination: Pagination = { page: 1, limit: 20, total: 0 }): Promise<{ data: Project[]; pagination: Pagination }> => {
    const params = { ...filters, page: pagination.page, limit: pagination.limit };
    const response: APIResponse<{ projects: Project[]; pagination: Pagination }> = await api.get('/projects', { params });
    return { data: response.data.projects, pagination: response.data.pagination };
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response: APIResponse<{ project: Project }> = await api.get(`/projects/${id}`);
    return response.data.project;
  },

  createProject: async (project: Partial<Project>): Promise<Project> => {
    const response: APIResponse<{ project: Project }> = await api.post('/projects', project);
    return response.data.project;
  },

  updateProject: async (id: string, project: Partial<Project>): Promise<Project> => {
    const response: APIResponse<{ project: Project }> = await api.put(`/projects/${id}`, project);
    return response.data.project;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getProjectBudget: async (id: string): Promise<any> => {
    const response = await api.get(`/projects/${id}/budget`);
    return response.data;
  },

  updateProjectStatus: async (id: string, status: string): Promise<Project> => {
    const response: APIResponse<{ project: Project }> = await api.put(`/projects/${id}/status`, { status });
    return response.data.project;
  },
};
