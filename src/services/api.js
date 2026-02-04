/**
 * API Service for HTTP requests
 * Handles CORS proxy, encryption, HMAC signatures
 */

import { CONFIG } from '../config/constants';
import { ApiError } from '../utils/errors';
import { getToken } from './storage';
import {
  encryptPayload,
  decryptPayload,
  generateHmac,
  generateSalt,
} from '../utils/crypto';

export class ApiService {
  /**
   * Makes an authenticated API call
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} [data=null] - Request payload
   * @param {string} [baseUrl=CONFIG.BASE_URL] - Base URL
   * @param {Object} [options={}] - Additional options
   * @returns {Promise<{status: number, data: Object, success: boolean}>}
   * @throws {ApiError}
   */
  static async call(method, endpoint, data = null, baseUrl = CONFIG.BASE_URL, options = {}) {
    const fullTargetUrl = `${baseUrl}${endpoint}`;
    const encrypted = data ? encryptPayload(data) : null;
    const body = encrypted ? JSON.stringify({ encrypted }) : null;

    // Debug logging
    console.log('[API] Call options:', options);

    // Generate request signature
    const nonce = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const salt = generateSalt();
    const signature = generateHmac(nonce, "studentportal", method, salt);

    // Prepare headers
    const headers = {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken() || "undefined"}`,
      "X-Origin": "studentportal",
      "X-HMAC-Nonce": nonce,
      "X-HMAC-Salt": salt,
      "X-HMAC-Signature": signature,
    };

    // Use CORS proxy
    const proxiedUrl = CONFIG.PROXY_URL + encodeURIComponent(fullTargetUrl);

    try {
      const response = await fetch(proxiedUrl, {
        method,
        mode: "cors",
        headers,
        body,
      });

      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      // Handle empty response
      if (!responseText || responseText.trim() === "") {
        if (!response.ok) {
          return {
            status: response.status,
            data: { message: response.statusText },
            success: false,
          };
        }
        throw new ApiError("Empty response from server", response.status);
      }

      // Parse response
      let responseData;
      try {
        responseData = contentType?.includes("text/plain")
          ? decryptPayload(responseText)
          : JSON.parse(responseText);
      } catch (parseError) {
        if (!response.ok) {
          return {
            status: response.status,
            data: { message: responseText || response.statusText },
            success: false,
          };
        }
        throw new ApiError(
          "Failed to parse server response",
          response.status,
          parseError,
        );
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.log('[API] 401 detected. isLoginRequest?', options.isLoginRequest);
        
        if (!options.isLoginRequest) {
          console.warn('[API] Not a login request - triggering token expiration handler');
          this.handleTokenExpiration();
        } else {
          console.log('[API] Login request - skipping token expiration handler');
        }
      }

      // Return response with status
      return {
        status: response.status,
        data: responseData,
        success: response.ok,
      };
    } catch (error) {
      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ApiError(
          "Network error. Please check your connection.",
          0,
          error,
        );
      }

      // Generic error
      throw new ApiError(error.message || "Request failed", 0, error);
    }
  }

  /**
   * Handles token expiration by clearing session and reloading
   * @private
   */
  static handleTokenExpiration() {
    console.warn('[API] Token expired - logging out and reloading page');
    
    // Dynamically import AuthService to avoid circular dependency
    import('./auth').then(({ AuthService }) => {
      AuthService.logout();
      window.location.reload();
    });
  }

  /**
   * Makes a GET request
   */
  static async get(endpoint, baseUrl) {
    return this.call("GET", endpoint, null, baseUrl, {});
  }

  /**
   * Makes a POST request
   */
  static async post(endpoint, data, baseUrl, options = {}) {
    console.log('[API.post] Called with options:', options);
    return this.call("POST", endpoint, data, baseUrl, options);
  }

  /**
   * Makes a PUT request
   */
  static async put(endpoint, data, baseUrl) {
    return this.call("PUT", endpoint, data, baseUrl, {});
  }

  /**
   * Makes a DELETE request
   */
  static async delete(endpoint, baseUrl) {
    return this.call("DELETE", endpoint, null, baseUrl, {});
  }
}
