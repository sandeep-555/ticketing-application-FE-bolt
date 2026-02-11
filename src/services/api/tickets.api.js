import axios from './axios';

export const ticketsAPI = {
  getAll: async (projectId, params) => {
    const response = await axios.get(`/projects/${projectId}/tickets`, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (ticketData) => {
    const response = await axios.post('/tickets', ticketData);
    return response.data;
  },

  update: async (id, ticketData) => {
    const response = await axios.patch(`/tickets/${id}`, ticketData);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/tickets/${id}`);
    return response.data;
  },

  getComments: async (id) => {
    const response = await axios.get(`/tickets/${id}/comments`);
    return response.data;
  },

  addComment: async (id, commentData) => {
    const response = await axios.post(`/tickets/${id}/comments`, commentData);
    return response.data;
  },

  getSubTasks: async (id) => {
    const response = await axios.get(`/tickets/${id}/subtasks`);
    return response.data;
  },

  createSubTask: async (id, subTaskData) => {
    const response = await axios.post(`/tickets/${id}/subtasks`, subTaskData);
    return response.data;
  },

  updateSubTask: async (subTaskId, data) => {
    const response = await axios.patch(`/subtasks/${subTaskId}`, data);
    return response.data;
  },

  deleteSubTask: async (subTaskId) => {
    const response = await axios.delete(`/subtasks/${subTaskId}`);
    return response.data;
  },

  getHistory: async (id) => {
    const response = await axios.get(`/tickets/${id}/history`);
    return response.data;
  },

  getApprovals: async (id) => {
    const response = await axios.get(`/tickets/${id}/approvals`);
    return response.data;
  },

  requestApproval: async (id, approvalData) => {
    const response = await axios.post(`/tickets/${id}/approve`, approvalData);
    return response.data;
  },

  uploadAttachment: async (id, formData) => {
    const response = await axios.post(`/tickets/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAttachments: async (id) => {
    const response = await axios.get(`/tickets/${id}/attachments`);
    return response.data;
  },
};
