import Taro from '@tarojs/taro';

const BASE_URL = 'http://localhost:3000/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: any;
}

export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = Taro.getStorageSync('token');

  try {
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method: options.method || 'GET',
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      data: options.data,
    });

    if (response.statusCode >= 400) {
      throw new Error(response.data.error || response.data.message || '请求失败');
    }
    return response.data;
  } catch (err: any) {
    if (err.errMsg?.includes('401') || err.statusCode === 401) {
      Taro.removeStorageSync('token');
      Taro.navigateTo({ url: '/pages/web/login/index' });
    }
    throw err;
  }
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data?: any) => request<T>(url, { method: 'POST', data }),
  patch: <T>(url: string, data?: any) => request<T>(url, { method: 'PATCH', data }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
