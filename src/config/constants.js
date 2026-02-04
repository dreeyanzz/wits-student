/**
 * Application Configuration Constants
 */

export const CONFIG = {
  // API URLs
  LOGIN_URL: 'https://citumobileapi.azurewebsites.net',
  API_URL: 'https://citumobileapi.azurewebsites.net',
  
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
