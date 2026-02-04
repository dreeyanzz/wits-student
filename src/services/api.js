/**
 * API Service for HTTP requests
 */

import { CONFIG } from '../config/constants';
import { ApiError } from '../utils/errors';
import { getToken } from './storage';

export class ApiService {
  static async request(endpoint, options = {}, baseUrl = CONFIG.API_URL, config = {}) {
    const { method = 'GET', body = null, headers = {} } = options;
    const { isLoginRequest = false } = config;
    
    const url = `${baseUrl}${endpoint}`;
    const token = getToken();
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const requestOptions = {
      method,
      headers: requestHeaders,
    };
    
    if (body) {
      requestOptions.body = JSON.stringify(body);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      let data = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401 && !isLoginRequest) {
          console.log('Unauthorized - token may have expired');
          window.location.reload();
          throw new ApiError('Unauthorized', 401, data);
        }
        
        throw new ApiError(
          data?.message || `HTTP Error ${response.status}`,
          response.status,
          data
        );
      }
      
      return {
        status: response.status,
        data,
        headers: response.headers
      };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 0);
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        error.message || 'Network request failed',
        0
      );
    }
  }

  static get(endpoint, baseUrl = CONFIG.API_URL, config = {}) {
    return this.request(endpoint, { method: 'GET' }, baseUrl, config);
  }

  static post(endpoint, body, baseUrl = CONFIG.API_URL, config = {}) {
    return this.request(endpoint, { method: 'POST', body }, baseUrl, config);
  }

  static put(endpoint, body, baseUrl = CONFIG.API_URL, config = {}) {
    return this.request(endpoint, { method: 'PUT', body }, baseUrl, config);
  }

  static delete(endpoint, baseUrl = CONFIG.API_URL, config = {}) {
    return this.request(endpoint, { method: 'DELETE' }, baseUrl, config);
  }
}
