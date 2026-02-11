import axios from './axios';

export const boardAPI = {
  getProjectBoard: async (projectId, params) => {
    const response = await axios.get(`/projects/${projectId}/board`, { params });
    return response.data;
  },

  getAssigneeBoard: async (assigneeId, params) => {
    const response = await axios.get(`/board/assignee/${assigneeId}`, { params });
    return response.data;
  },

  bulkUpdateStatus: async (updates) => {
    const response = await axios.patch('/tickets/bulk-status', updates);
    return response.data;
  },
};

export const exportAPI = {
  exportTickets: async (params) => {
    const response = await axios.get('/export/tickets', { params, responseType: 'blob' });
    return response;
  },

  exportReports: async (reportType, params) => {
    const response = await axios.get(`/export/reports/${reportType}`, {
      params,
      responseType: 'blob',
    });
    return response;
  },

  exportTimeLogs: async (params) => {
    const response = await axios.get('/export/time-logs', { params, responseType: 'blob' });
    return response;
  },
};

export const approvalAPI = {
  getUserPendingApprovals: async () => {
    const response = await axios.get('/approvals/user/pending');
    return response.data;
  },

  getManagerQueue: async () => {
    const response = await axios.get('/approvals/manager/queue');
    return response.data;
  },

  processApproval: async (approvalId, decision) => {
    const response = await axios.post(`/approvals/${approvalId}/process`, decision);
    return response.data;
  },
};
