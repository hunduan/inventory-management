// HTTP 请求客户端，带 JWT token 自动注入和 401 拦截
export const API_BASE = 'http://localhost:3000/api';

interface RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
}

function request<T>(options: RequestOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const token = wx.getStorageSync('token') || '';
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.header,
    };
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: API_BASE + options.url,
      method: options.method,
      data: options.data,
      header,
      success(res) {
        if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('user');
          wx.reLaunch({ url: '/pages/login/login' });
          reject(new Error('未登录或登录已过期'));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          const errMsg = (res.data as any)?.message || `请求失败 (${res.statusCode})`;
          reject(new Error(errMsg));
        }
      },
      fail(err) {
        reject(new Error('网络错误: ' + (err.errMsg || '未知错误')));
      },
    });
  });
}

export const api = {
  get<T = any>(url: string, data?: any): Promise<T> {
    return request<T>({ url, method: 'GET', data });
  },
  post<T = any>(url: string, data?: any): Promise<T> {
    return request<T>({ url, method: 'POST', data });
  },
  patch<T = any>(url: string, data?: any): Promise<T> {
    return request<T>({ url, method: 'PATCH', data });
  },
  del<T = any>(url: string, data?: any): Promise<T> {
    return request<T>({ url, method: 'DELETE', data });
  },
  upload<T = any>(url: string, filePath: string, name: string = 'file', formData?: Record<string, any>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const token = wx.getStorageSync('token') || '';
      const header: Record<string, string> = {};
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }

      wx.uploadFile({
        url: API_BASE + url,
        filePath,
        name,
        formData,
        header,
        success(res) {
          if (res.statusCode === 401) {
            wx.removeStorageSync('token');
            wx.removeStorageSync('user');
            wx.reLaunch({ url: '/pages/login/login' });
            reject(new Error('未登录或登录已过期'));
            return;
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(res.data) as T);
            } catch {
              resolve(res.data as unknown as T);
            }
          } else {
            try {
              const parsed = JSON.parse(res.data);
              reject(new Error(parsed.message || `上传失败 (${res.statusCode})`));
            } catch {
              reject(new Error(`上传失败 (${res.statusCode})`));
            }
          }
        },
        fail(err) {
          reject(new Error('上传网络错误: ' + (err.errMsg || '未知错误')));
        },
      });
    });
  },
};

export default api;
