import api from './api';
import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io('http://localhost:5001', {
      auth: {
        token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat connection error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinWorkspace(workspaceId) {
    if (this.socket) {
      this.socket.emit('join-workspace', workspaceId);
    }
  }

  leaveWorkspace(workspaceId) {
    if (this.socket) {
      this.socket.emit('leave-workspace', workspaceId);
    }
  }

  sendMessage(workspaceId, content) {
    if (this.socket) {
      this.socket.emit('send-message', { workspaceId, content });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off('new-message', callback);
    }
  }

  async getMessages(workspaceId, limit = 50, offset = 0) {
    const response = await api.get(`/chat/workspaces/${workspaceId}/messages`, {
      params: { limit, offset }
    });
    return response.data;
  }
}

export const chatService = new ChatService();