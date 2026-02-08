/**
 * Authentication Service
 */

import { ApiService } from './api';
import { Validator } from '../utils/validation';
import { AuthenticationError } from '../utils/errors';
import { CONFIG } from '../config/constants';
import {
  stateManager,
  setToken,
  setUserData,
  setStudentInfo,
  setAcademicYears,
  setCurrentAcademicYearId,
  setCurrentTermId,
  getUserData,
  getToken
} from './storage';

export class AuthService {
  static async login(userId, password) {
    // Validate inputs
    Validator.required(userId, 'Student ID');
    Validator.required(password, 'Password');
    Validator.studentId(userId);

    // Make login API call
    const result = await ApiService.post(
      '/api/User/student/login',
      { userId, password, clientId: CONFIG.CLIENT_ID },
      CONFIG.LOGIN_URL,
      { isLoginRequest: true }
    );

    // Check for successful login
    if (result.status === 401) {
      throw new AuthenticationError('Invalid credentials. Please check your Student ID and password.');
    }

    // Check for token
    if (!result.data?.token) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Store authentication data
    setToken(result.data.token);
    setUserData(result.data.userInfo);

    // Initialize academic context
    await this.initializeAcademicContext(result.data.userInfo);

    return {
      success: true,
      userData: result.data.userInfo
    };
  }

  static async restoreSession() {
    try {
      const token = getToken();
      const userData = getUserData();
      
      if (!token || !userData) {
        console.log('No session data found');
        return { success: false, userData: null };
      }

      if (!stateManager.hasValidSession()) {
        console.log('Incomplete session data - re-initializing academic context...');
        
        try {
          await this.initializeAcademicContext(userData);
          
          if (!stateManager.hasValidSession()) {
            throw new Error('Failed to initialize academic context');
          }
          
          console.log('Academic context re-initialized successfully');
          return { success: true, userData };
          
        } catch (initError) {
          console.error('Failed to re-initialize academic context:', initError);
          this.logout();
          return { success: false, userData: null };
        }
      }

      // Verify token is still valid
      try {
        const testResult = await ApiService.get(
          `/api/user/student/${userData.userId}/info`,
          CONFIG.LOGIN_URL
        );
        
        if (testResult.status !== 200) {
          throw new Error('Token validation failed');
        }
        
        console.log('Session restored successfully');
        return { success: true, userData };
        
      } catch (apiError) {
        console.error('Token validation failed:', apiError);
        this.logout();
        return { success: false, userData: null };
      }
      
    } catch (error) {
      console.error('Session restoration failed:', error);
      this.logout();
      return { success: false, userData: null };
    }
  }

  static async initializeAcademicContext(userData) {
    try {
      // Fetch student info
      const infoResult = await ApiService.get(
        `/api/user/student/${userData.userId}/info`,
        CONFIG.LOGIN_URL
      );

      if (infoResult.status === 200 && infoResult.data?.items) {
        setStudentInfo(infoResult.data.items);
      } else {
        throw new Error('Failed to fetch student information');
      }

      // Fetch academic years
      const yearsResult = await ApiService.get(
        `/api/student/${userData.studentId}/academicyears`
      );

      if (yearsResult.status === 200 && yearsResult.data?.items) {
        const years = yearsResult.data.items;
        setAcademicYears(years);

        // Set current academic year
        const studentInfo = stateManager.get('studentInfo');
        let currentYearId = null;

        if (studentInfo?.academicYear) {
          const matchingYear = years.find(y => y.name === studentInfo.academicYear);
          if (matchingYear) {
            currentYearId = matchingYear.id;
            stateManager.set('currentAcademicYearName', matchingYear.name);
          }
        }

        // Fallback to latest year
        if (!currentYearId && years.length > 0) {
          const latestYear = years[years.length - 1];
          currentYearId = latestYear.id;
          stateManager.set('currentAcademicYearName', latestYear.name);
        }

        if (!currentYearId) {
          throw new Error('No academic years available');
        }

        setCurrentAcademicYearId(currentYearId);

        // Fetch terms for current year
        await this.initializeTerms(userData.studentId, currentYearId, studentInfo);

      } else {
        throw new Error('Failed to fetch academic years');
      }

    } catch (error) {
      console.error('Error initializing academic context:', error);
      throw error;
    }
  }

  static async initializeTerms(studentId, yearId, studentInfo) {
    const termsResult = await ApiService.get(
      `/api/student/${studentId}/${yearId}/terms`
    );

    if (termsResult.status === 200 && termsResult.data?.items) {
      const terms = termsResult.data.items;
      stateManager.set('availableTerms', terms);

      let currentTermId = null;

      if (studentInfo?.term) {
        const matchingTerm = terms.find(t => t.name === studentInfo.term);
        if (matchingTerm) {
          currentTermId = matchingTerm.id;
          stateManager.set('currentTermName', matchingTerm.name);
        }
      }

      // Fallback to latest term
      if (!currentTermId && terms.length > 0) {
        const latestTerm = terms[terms.length - 1];
        currentTermId = latestTerm.id;
        stateManager.set('currentTermName', latestTerm.name);
      }

      if (!currentTermId) {
        throw new Error('No terms available');
      }

      setCurrentTermId(currentTermId);

    } else {
      throw new Error('Failed to fetch terms');
    }
  }

  static logout() {
    stateManager.reset();
  }

  static isAuthenticated() {
    return !!stateManager.get('token') && !!stateManager.get('userData');
  }

  static getCurrentUser() {
    return getUserData();
  }

  /**
   * Sends password reset request
   * @param {string} studentId - Student ID
   * @param {string} birthdate - Birthdate in YYYY-MM-DD format
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async forgotPassword(studentId, birthdate) {
    // Validate inputs
    Validator.required(studentId, 'Student ID');
    Validator.required(birthdate, 'Birthdate');
    Validator.studentId(studentId);

    // Convert birthdate to ISO format with time
    let formattedBirthdate;
    try {
      const date = new Date(birthdate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      formattedBirthdate = date.toISOString();
    } catch (error) {
      throw new AuthenticationError('Invalid birthdate format. Please use a valid date.');
    }

    // Make forgot password API call
    const result = await ApiService.post(
      '/api/user/student/forgotpassword',
      { 
        studentID: studentId, 
        studentBirthDate: formattedBirthdate 
      },
      CONFIG.LOGIN_URL,
      { isForgotPasswordRequest: true }
    );

    // Check for successful request
    if (result.status === 404) {
      throw new AuthenticationError('Record does not exist. Please check your Student ID and birthdate.');
    }

    if (result.status !== 200) {
      throw new AuthenticationError('Password reset failed. Please try again.');
    }

    return {
      success: true,
      message: result.data?.message || 'Password reset is successful. Please check your email.'
    };
  }

  /**
   * Handles API errors (for use by components)
   * @param {Error} error - The error object
   */
  static handleApiError(error) {
    // If it's a 401 (Unauthorized), token has expired
    if (error.status === 401 || error.statusCode === 401) {
      console.log('Token expired, logging out...');
      this.logout();
      window.location.reload();
    }
  }
}
