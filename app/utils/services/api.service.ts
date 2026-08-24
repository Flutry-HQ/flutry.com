import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// TypeScript interfaces
interface ApiConfig {
  baseURL: string;
  retries?: number;
}

interface RequestOptions<T = any> {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: T;
  token?: string | null;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, any>;
}

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: process.env.API_HOST as string,
  retries: 1,
};

export default class ApiService {
  private axiosInstance: AxiosInstance;
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
    });
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (this.shouldRetry(error) && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          if (originalRequest._retryCount <= (this.config.retries || 2)) {
            await this.delay(200);
            return this.axiosInstance(originalRequest);
          }
        }

        throw this.handleError(error);
      },
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    return (
      !error.response ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      (error.response.status >= 500 && error.response.status !== 501)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleError(error: any) {
    const response = error.response as AxiosResponse | undefined;
    if (response) {
      return response.data;
    }
    return error;
  }

  private async makeRequest<T = any>({ url, method, data, params, headers = {}, token }: RequestOptions): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      url,
      method,
      params,
      headers: {
        ...headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    if (data && ['POST', 'PUT'].includes(method)) {
      config.data = data;
    }

    try {
      const response: AxiosResponse<T> = await this.axiosInstance(config);
      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error: any) {
      // Axios interceptor már ApiError-t dob, de biztosítjuk a típust
      throw this.handleError(error);
    }
  }

  async get<T = any>(url: string, token?: string | null, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ ...options, url, method: 'GET', token });
  }

  async post<T = any, D = any>(
    url: string,
    data?: D,
    token?: string | null,
    options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ ...options, url, method: 'POST', data, token });
  }

  async put<T = any, D = any>(
    url: string,
    data?: D,
    token?: string | null,
    options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ ...options, url, method: 'PUT', data, token });
  }

  async delete<T = any>(url: string, token?: string | null, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ ...options, url, method: 'DELETE', token });
  }
}

export const api = new ApiService();
