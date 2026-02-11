export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  AGENT: 'AGENT',
  CUSTOMER: 'CUSTOMER',
};

export const TICKET_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
};

export const TICKET_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const WORK_CATEGORY = {
  DEVELOPMENT: 'DEVELOPMENT',
  BAU: 'BAU',
  SUPPORT: 'SUPPORT',
};

export const WORK_TYPE = {
  NEW_FEATURE: 'NEW_FEATURE',
  BUG_FIX: 'BUG_FIX',
  ENHANCEMENT: 'ENHANCEMENT',
  MAINTENANCE: 'MAINTENANCE',
  INCIDENT: 'INCIDENT',
};


export const STATUS_COLORS = {
  TODO: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DONE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export const PRIORITY_COLORS = {
  LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  CRITICAL: 'bg-danger-100 text-danger-700 dark:bg-danger-900 dark:text-danger-200',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  TICKETS: '/tickets',
  TICKET_DETAIL: '/tickets/:id',
  BOARD: '/board',
  REPORTS: '/reports',
  EXPORTS: '/exports',
  ADMIN: '/admin',
  CLIENT: '/client',
};



export const WORK_TYPE_MAP = {
  DEVELOPMENT: [
    { value: 'NEW_FEATURE', label: 'New Feature' },
    { value: 'BUG_FIX', label: 'Bug Fix' },
    { value: 'ENHANCEMENT', label: 'Enhancement' },
  ],

  BAU: [
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'ENHANCEMENT', label: 'Enhancement' },
  ],

  SUPPORT: [
    { value: 'INCIDENT', label: 'Incident' },
    { value: 'BUG_FIX', label: 'Bug Fix' },
  ],
};
