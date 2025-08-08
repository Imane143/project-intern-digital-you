import api from './api';

export const documentService = {
  uploadFile: async (workspaceId, file, folderPath = '/') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', folderPath);

    const response = await api.post(`/documents/workspaces/${workspaceId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getDocuments: async (workspaceId, folderPath = '/') => {
    const response = await api.get(`/documents/workspaces/${workspaceId}/files`, {
      params: { folderPath }
    });
    return response.data;
  },

  downloadFile: async (workspaceId, fileId) => {
    const response = await api.get(`/documents/workspaces/${workspaceId}/files/${fileId}/download`, {
      responseType: 'blob'
    });
    return response;
  },

  deleteFile: async (workspaceId, fileId) => {
    const response = await api.delete(`/documents/workspaces/${workspaceId}/files/${fileId}`);
    return response.data;
  },

  getFolders: async (workspaceId) => {
    const response = await api.get(`/documents/workspaces/${workspaceId}/folders`);
    return response.data;
  },

  createFolder: async (workspaceId, name, parentPath = '/') => {
    const response = await api.post(`/documents/workspaces/${workspaceId}/folders`, {
      name,
      parentPath
    });
    return response.data;
  }
};