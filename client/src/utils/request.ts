import Taro from '@tarojs/taro';

const BASE_URL = process.env.API_BASE_URL as string || 'http://localhost:3000/api';

const LOGIN_PATH = process.env.TARO_ENV === 'weapp'
  ? '/pages/mini/login/index'
  : '/pages/web/login/index';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: unknown;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
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
      const data = response.data as { error?: string; message?: string } | undefined;
      throw new ApiError(data?.error || data?.message || '请求失败', response.statusCode, response.data);
    }
    return response.data;
  } catch (err: any) {
    if (err.errMsg?.includes('401') || err.statusCode === 401) {
      Taro.removeStorageSync('token');
      Taro.reLaunch({ url: LOGIN_PATH });
    }
    throw err;
  }
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data?: unknown) => request<T>(url, { method: 'POST', data }),
  patch: <T>(url: string, data?: unknown) => request<T>(url, { method: 'PATCH', data }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
