import api from './api';

export const boardService = {
  getBoards: async (workspaceId) => {
    const response = await api.get(`/workspaces/${workspaceId}/boards`);
    return response.data;
  },

  createBoard: async (workspaceId, data) => {
    const response = await api.post(`/workspaces/${workspaceId}/boards`, data);
    return response.data;
  },

  getBoardWithLists: async (workspaceId, boardId) => {
    const response = await api.get(`/workspaces/${workspaceId}/boards/${boardId}`);
    return response.data;
  },

  createTask: async (workspaceId, boardId, data) => {
    const response = await api.post(`/workspaces/${workspaceId}/boards/${boardId}/tasks`, data);
    return response.data;
  },

  updateTask: async (workspaceId, taskId, data) => {
    const response = await api.put(`/workspaces/${workspaceId}/tasks/${taskId}`, data);
    return response.data;
  },

  deleteTask: async (workspaceId, taskId) => {
    const response = await api.delete(`/workspaces/${workspaceId}/tasks/${taskId}`);
    return response.data;
  },

  moveTask: async (workspaceId, data) => {
    const response = await api.post(`/workspaces/${workspaceId}/tasks/move`, data);
    return response.data;
  }
};