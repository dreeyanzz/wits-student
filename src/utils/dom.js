/**
 * DOM utility functions
 */

import { COLORS } from '../config/constants';

/**
 * Generates deterministic hash from string
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Gets consistent color for course code
 * @param {string} courseCode - Course code
 * @returns {string} Hex color
 */
export function getCourseColor(courseCode) {
  if (!courseCode) return COLORS[0];
  
  const hash = hashString(courseCode);
  const colorIndex = hash % COLORS.length;
  return COLORS[colorIndex];
}

/**
 * Creates loading indicator HTML
 * @param {string} [message='Loading...'] - Loading message
 * @returns {string} HTML string
 */
export function createLoadingHTML(message = 'Loading...') {
  return `
    <div class="loading">
      <div class="loading-spinner"></div>
      <div>${message}</div>
    </div>
  `;
}

/**
 * Creates error message HTML
 * @param {string} message - Error message
 * @returns {string} HTML string
 */
export function createErrorHTML(message) {
  return `<div class="loading">⚠️ ${message}</div>`;
}

/**
 * Detects if user is on mobile device
 * @returns {boolean}
 */
export function isMobileDevice() {
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}
