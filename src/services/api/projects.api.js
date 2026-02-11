import axios from './axios';

export const projectsAPI = {
  getAll: async (params) => {
    const response = await axios.get('/projects', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/projects/${id}`);
    return response.data;
  },

  create: async (projectData) => {
    const response = await axios.post('/projects', projectData);
    return response.data;
  },

  update: async (id, projectData) => {
    const response = await axios.patch(`/projects/${id}`, projectData);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/projects/${id}`);
    return response.data;
  },

  getMembers: async (id) => {
    const response = await axios.get(`/projects/${id}/members`);
    return response.data;
  },

  addMember: async (id, memberData) => {
    const response = await axios.post(`/projects/${id}/members`, memberData);
    return response.data;
  },

  updateMember: async (id, memberId, data) => {
    const response = await axios.patch(`/projects/${id}/members/${memberId}`, data);
    return response.data;
  },

  removeMember: async (id, memberId) => {
    const response = await axios.delete(`/projects/${id}/members/${memberId}`);
    return response.data;
  },

  getAgents: async (search = '') => {
  const response = await axios.get(`/projects/agents`, {
    params: { search },
  });
  return response.data;
}

};
