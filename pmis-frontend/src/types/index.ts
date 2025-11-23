// Global TypeScript types and interfaces for PMIS frontend

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  lastLogin: string | null;
  status: 'active' | 'inactive' | 'suspended';
}

export type UserRole = 'admin' | 'manager' | 'engineer' | 'approver' | 'viewer';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (ms)
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: 'high' | 'medium' | 'low';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  milestones: Milestone[];
  team: User[];
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Equipment {
  id: string;
  name: string;
  serial: string;
  category: string;
  status: 'AVAILABLE' | 'ALLOCATED' | 'MAINTENANCE';
  value: number;
  location: string;
  lastMaintenanceDate: string | null;
  nextMaintenanceDue: string | null;
}

export interface Budget {
  id: string;
  projectId: string;
  total: number;
  spent: number;
  categories: BudgetCategory[];
  alerts: BudgetAlert[];
}

export interface BudgetCategory {
  name: string;
  amount: number;
  spent: number;
}

export interface BudgetAlert {
  type: 'warning' | 'overrun';
  message: string;
  triggeredAt: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: APIError;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ProjectFormValues {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  priority: 'high' | 'medium' | 'low';
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}
