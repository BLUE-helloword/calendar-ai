import axios from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '../types/api';

const instance = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：注入 Token
instance.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch { /* ignore */ }
  }
  return config;
});

// 响应拦截器：统一错误处理，不改变返回值类型
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 403) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    const msg = err.response?.data?.message || '网络异常，请稍后重试';
    message.error(msg);
    return Promise.reject(err);
  }
);

// 类型安全的请求封装：自动提取 res.data.data
const request = {
  async get<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    const res = await instance.get<ApiResponse<T>>(url, config);
    if (res.data.code !== 0) {
      message.error(res.data.message || '请求失败');
      throw res.data;
    }
    return res.data.data;
  },

  async post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    const res = await instance.post<ApiResponse<T>>(url, data, config);
    if (res.data.code !== 0) {
      message.error(res.data.message || '请求失败');
      throw res.data;
    }
    return res.data.data;
  },

  async put<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    const res = await instance.put<ApiResponse<T>>(url, data, config);
    if (res.data.code !== 0) {
      message.error(res.data.message || '请求失败');
      throw res.data;
    }
    return res.data.data;
  },

  async delete<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    const res = await instance.delete<ApiResponse<T>>(url, config);
    if (res.data.code !== 0) {
      message.error(res.data.message || '请求失败');
      throw res.data;
    }
    return res.data.data;
  },
};

export default request;
