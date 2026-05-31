import api from './client';

export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<{ url: string; text?: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  uploadAudio: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<{ text: string }>('/upload/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
