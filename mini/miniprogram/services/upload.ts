import { api } from './request';

export interface UploadImageResponse {
  url: string;
  text?: string;
}

export interface UploadAudioResponse {
  text: string;
}

export const uploadApi = {
  image(filePath: string) {
    return api.upload<UploadImageResponse>('/upload/image', filePath, 'file');
  },
  audio(filePath: string) {
    return api.upload<UploadAudioResponse>('/upload/audio', filePath, 'file');
  },
};

export default uploadApi;
