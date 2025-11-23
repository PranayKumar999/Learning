interface ApiOptions extends RequestInit {
  data?: any;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiWrapper {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T = any>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const { data, headers = {}, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data) {
      // Check if we need to send form data
      if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
        const formData = new URLSearchParams();
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
        config.body = formData.toString();
      } else {
        config.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      let responseData;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        return {
          error:
            responseData?.message ||
            `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      return {
        data: responseData,
        status: response.status,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Network error occurred',
        status: 0,
      };
    }
  }

  async get<T = any>(
    endpoint: string,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', data });
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', data });
  }

  async delete<T = any>(
    endpoint: string,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create instances for different API endpoints
export const api = new ApiWrapper('/api');
export const backendApi = new ApiWrapper(
  process.env.NEXT_PUBLIC_BACKEND_URL || ''
);

// Export the class for custom instances
export default ApiWrapper;
