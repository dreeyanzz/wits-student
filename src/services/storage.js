/**
 * State Management Service with localStorage persistence
 */

import { CONFIG, PERSIST_KEYS } from '../config/constants';

class StateManager {
  constructor() {
    this.state = {
      // Authentication
      token: null,
      userData: null,
      studentInfo: null,
      
      // Academic Context
      academicYears: [],
      currentAcademicYearId: null,
      currentAcademicYearName: null,
      currentTermId: null,
      currentTermName: null,
      availableTerms: [],
    };
    
    this.listeners = new Map();
    
    // Load persisted state from localStorage
    this.loadFromStorage();
    
    // Listen for storage changes in other tabs
    this.setupStorageListener();
  }

  loadFromStorage() {
    PERSIST_KEYS.forEach(key => {
      try {
        const storedValue = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
        if (storedValue !== null) {
          this.state[key] = JSON.parse(storedValue);
        }
      } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        try {
          localStorage.removeItem(CONFIG.STORAGE_PREFIX + key);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  }

  saveToStorage(key, value) {
    if (PERSIST_KEYS.includes(key)) {
      try {
        if (value === null || value === undefined) {
          localStorage.removeItem(CONFIG.STORAGE_PREFIX + key);
        } else {
          localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
        }
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
        if (error.name === 'QuotaExceededError') {
          console.warn('LocalStorage quota exceeded. Consider clearing old data.');
        }
      }
    }
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === CONFIG.STORAGE_PREFIX + 'token' && e.newValue === null) {
        console.log('Logout detected in another tab');
        window.location.reload();
      }
    });
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this.saveToStorage(key, value);
    this.notify(key, value);
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
    
    return () => {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    };
  }

  notify(key, value) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(value));
    }
  }

  reset() {
    Object.keys(this.state).forEach(key => {
      if (Array.isArray(this.state[key])) {
        this.state[key] = [];
      } else {
        this.state[key] = null;
      }
    });
    
    PERSIST_KEYS.forEach(key => {
      try {
        localStorage.removeItem(CONFIG.STORAGE_PREFIX + key);
      } catch (error) {
        console.error(`Error removing ${key} from localStorage:`, error);
      }
    });
  }

  hasValidSession() {
    const token = this.get('token');
    const userData = this.get('userData');
    const studentInfo = this.get('studentInfo');
    const academicYears = this.get('academicYears');
    const currentAcademicYearId = this.get('currentAcademicYearId');
    const currentTermId = this.get('currentTermId');
    
    return !!(
      token && 
      userData && 
      studentInfo && 
      academicYears && academicYears.length > 0 &&
      currentAcademicYearId &&
      currentTermId
    );
  }

  getAll() {
    return { ...this.state };
  }
}

// Singleton instance
export const stateManager = new StateManager();

// Convenience exports
export const getToken = () => stateManager.get('token');
export const setToken = (token) => stateManager.set('token', token);

export const getUserData = () => stateManager.get('userData');
export const setUserData = (data) => stateManager.set('userData', data);

export const getStudentInfo = () => stateManager.get('studentInfo');
export const setStudentInfo = (data) => stateManager.set('studentInfo', data);

export const getAcademicYears = () => stateManager.get('academicYears');
export const setAcademicYears = (years) => stateManager.set('academicYears', years);

export const getCurrentAcademicYearId = () => stateManager.get('currentAcademicYearId');
export const setCurrentAcademicYearId = (id) => stateManager.set('currentAcademicYearId', id);

export const getCurrentTermId = () => stateManager.get('currentTermId');
export const setCurrentTermId = (id) => stateManager.set('currentTermId', id);

// Generic getter for any key
export const getItem = (key) => stateManager.get(key);
// Generic setter for any key
export const setItem = (key, value) => stateManager.set(key, value);
