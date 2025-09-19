import axios from 'axios';
import { Agent } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; agent: Agent }> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; agent: Agent }> {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  async verifyToken(): Promise<{ valid: boolean; agent: Agent }> {
    const response = await api.get('/auth/verify');
    return response.data;
  }
};

export const chatService = {
  async getMessages(sessionId: string) {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data;
  },

  async getActiveSessions() {
    const response = await api.get('/chat/sessions');
    return response.data;
  },

  async createSession(sessionId: string, customerName: string) {
    const response = await api.post('/chat/sessions', { sessionId, customerName });
    return response.data;
  },

  async updateSessionStatus(sessionId: string, status: string) {
    const response = await api.patch(`/chat/sessions/${sessionId}`, { status });
    return response.data;
  }
};

export default api;