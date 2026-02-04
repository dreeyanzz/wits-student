/**
 * Cryptography Utilities
 * Uses CryptoJS library (loaded via CDN in index.html)
 */

import { CONFIG } from '../config/constants';

/**
 * Encrypts data payload using AES encryption
 * @param {Object} data - Data to encrypt
 * @returns {string} Encrypted payload
 */
export function encryptPayload(data) {
  const key = window.CryptoJS.SHA256(CONFIG.ENCRYPTION_KEY);
  const iv = window.CryptoJS.enc.Utf8.parse(CONFIG.ENCRYPTION_KEY.substring(0, 16));
  
  return window.CryptoJS.AES.encrypt(JSON.stringify(data), key, {
    iv,
    mode: window.CryptoJS.mode.CBC,
    padding: window.CryptoJS.pad.Pkcs7,
  }).toString();
}

/**
 * Decrypts encrypted payload
 * @param {string} encrypted - Encrypted data
 * @returns {Object} Decrypted data
 */
export function decryptPayload(encrypted) {
  const key = window.CryptoJS.SHA256(CONFIG.ENCRYPTION_KEY);
  const iv = window.CryptoJS.enc.Utf8.parse(CONFIG.ENCRYPTION_KEY.substring(0, 16));
  
  const decrypted = window.CryptoJS.AES.decrypt(encrypted, key, {
    iv,
    mode: window.CryptoJS.mode.CBC,
    padding: window.CryptoJS.pad.Pkcs7,
  });
  
  return JSON.parse(decrypted.toString(window.CryptoJS.enc.Utf8));
}

/**
 * Generates HMAC signature for request authentication
 * @param {string} nonce - Random nonce
 * @param {string} origin - Origin identifier
 * @param {string} method - HTTP method
 * @param {string} salt - Random salt
 * @returns {string} HMAC signature
 */
export function generateHmac(nonce, origin, method, salt) {
  const msg = `${nonce}:${origin}:${method}:${salt}:${CONFIG.CLIENT_SECRET}`;
  return window.CryptoJS.HmacSHA256(msg, CONFIG.HMAC_SECRET).toString(window.CryptoJS.enc.Hex);
}

/**
 * Generates random salt
 * @returns {string} Base64 encoded salt
 */
export function generateSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
