import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Papers
export const getPapers = async () => {
  const response = await api.get('/papers/');
  return response.data;
};

export const getPaper = async (paperId) => {
  const response = await api.get(`/papers/${paperId}`);
  return response.data;
};

export const getPaperChunks = async (paperId) => {
  const response = await api.get(`/papers/${paperId}/chunks`);
  return response.data;
};

export const uploadPaper = async (formData) => {
  const response = await api.post('/papers/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deletePaper = async (paperId) => {
  const response = await api.delete(`/papers/${paperId}`);
  return response.data;
};

// Chat
export const askQuestion = async (question, paperIds) => {
  const response = await api.post('/chat/ask', {
    question,
    paper_ids: paperIds,
    top_k: 5,
  });
  return response.data;
};

export const comparePapers = async (question, paperIds) => {
  const response = await api.post('/chat/compare', {
    question,
    paper_ids: paperIds,
  });
  return response.data;
};

export const summarizePaper = async (paperId) => {
  const response = await api.post(`/chat/summarize?paper_id=${paperId}`);
  return response.data;
};

// Highlights
export const createHighlight = async (data) => {
  const response = await api.post('/highlights/create', data);
  return response.data;
};

export const getPaperHighlights = async (paperId) => {
  const response = await api.get(`/highlights/paper/${paperId}`);
  return response.data;
};

export const deleteHighlight = async (highlightId) => {
  const response = await api.delete(`/highlights/${highlightId}`);
  return response.data;
};

export default api;