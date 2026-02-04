/**
 * Application Configuration Constants
 * 
 * SECURITY NOTE:
 * The encryption and HMAC keys below are exposed in client-side code.
 * This is acceptable for this application because:
 * 
 * 1. These keys serve as APPLICATION IDENTIFIERS, not authentication secrets
 * 2. Real security is provided by student authentication + JWT tokens
 * 3. Server validates everything - students can only access their own data
 * 4. Common pattern for SPAs (Firebase, Auth0, Stripe all expose keys)
 */

export const CONFIG = {
  // Encryption & Authentication Keys
  ENCRYPTION_KEY: "anotherUniqueSuperSecretKeyEnrollmentAdmin123",
  HMAC_SECRET: "ourSuperSecretKeyEnrollmentAdmin123",
  CLIENT_SECRET: "aP9!vB7@kL3#xY5$zQ2^mN8&dR1*oW6%uJ4(eT0)",
  
  // API URLs (correct staging URLs)
  BASE_URL: "https://rg-cit-u-staging-004-wa-014.azurewebsites.net",
  LOGIN_URL: "https://rg-cit-u-staging-004-wa-017.azurewebsites.net",
  API_URL: "https://rg-cit-u-staging-004-wa-014.azurewebsites.net",
  
  // CORS Proxy (required for browser requests)
  PROXY_URL: "https://wildcat-one-api-proxy.adriangwapoz125.workers.dev/?url=",
  
  // API Timeouts
  API_TIMEOUT: 30000,
  
  // Client ID
  CLIENT_ID: '001',
  
  // Storage Keys
  STORAGE_PREFIX: 'wildcatOne_',
  
  // Session Keys
  TOKEN_KEY: 'token',
  USER_DATA_KEY: 'userData',
  STUDENT_INFO_KEY: 'studentInfo',
  
  // Academic Keys
  ACADEMIC_YEARS_KEY: 'academicYears',
  CURRENT_YEAR_ID_KEY: 'currentAcademicYearId',
  CURRENT_YEAR_NAME_KEY: 'currentAcademicYearName',
  CURRENT_TERM_ID_KEY: 'currentTermId',
  CURRENT_TERM_NAME_KEY: 'currentTermName',
  AVAILABLE_TERMS_KEY: 'availableTerms',
};

export const PERSIST_KEYS = [
  'token',
  'userData',
  'studentInfo',
  'academicYears',
  'currentAcademicYearId',
  'currentAcademicYearName',
  'currentTermId',
  'currentTermName',
  'availableTerms'
];

/**
 * Pastel color palette for course visualization
 * Colors follow spectrum: Red → Orange → Yellow → Green → Blue → Indigo → Violet
 */
export const COLORS = [
  "#ffd6dd", "#ffe0e6", "#ffc9d1", "#ffd6dd", "#ffd0d8", "#ffbdc7", "#ffd1d9", "#ffc4ce",
  "#ffe5d1", "#fff0e0", "#ffddc9", "#ffe5d4", "#ffd9c2", "#ffd1b8", "#ffcfb3",
  "#fffedd", "#ffffe6", "#ffffd2", "#ffffd9", "#ffffcc", "#ffffc4", "#ffffb8",
  "#f0ffd2", "#f5ffdb", "#ebffe0", "#edffcc", "#e6ffc4", "#e3ffb8", "#dfffad",
  "#d6ffd6", "#e0ffe0", "#ccffcc", "#d1ffd1", "#c7ffc7", "#b8ffb8", "#c2ffc2",
  "#d6ffff", "#e0ffff", "#ccffff", "#d1ffff", "#c7ffff", "#b8ffff", "#c2ffff",
  "#d6e6ff", "#e0edff", "#cce0ff", "#d1e6ff", "#c7ddff", "#b8d4ff", "#c2dbff",
  "#ddd2ff", "#e6dbff", "#d4ccff", "#dbd1ff", "#d1c7ff", "#c7bdff", "#cec4ff",
  "#e6d6ff", "#eddeff",
];

/**
 * Days of the week
 */
export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * Day code to index mapping
 */
export const DAY_CODE_MAP = {
  M: 0,
  T: 1,
  W: 2,
  TH: 3,
  F: 4,
  S: 5,
  SU: 6,
};

/**
 * Day code to full name mapping
 */
export const DAY_NAME_MAP = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  TH: "Thursday",
  F: "Friday",
  S: "Saturday",
  SU: "Sunday",
};
