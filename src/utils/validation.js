/**
 * Input Validation Utilities
 */

import { ValidationError } from './errors';

export class Validator {
  /**
   * Validates required field
   */
  static required(value, fieldName) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
  }

  /**
   * Validates student ID format
   */
  static studentId(value) {
    if (!value) {
      throw new ValidationError('Student ID is required', 'studentId');
    }
    
    const studentIdPattern = /^\d{2}-\d{4}-\d{3}$/;
    if (!studentIdPattern.test(value.trim())) {
      throw new ValidationError(
        'Invalid Student ID format. Expected format: XX-XXXX-XXX',
        'studentId'
      );
    }
  }

  /**
   * Validates email format
   */
  static email(value) {
    if (!value) {
      throw new ValidationError('Email is required', 'email');
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value.trim())) {
      throw new ValidationError('Invalid email format', 'email');
    }
  }

  /**
   * Validates password minimum length
   */
  static password(value, minLength = 6) {
    if (!value) {
      throw new ValidationError('Password is required', 'password');
    }
    
    if (value.length < minLength) {
      throw new ValidationError(
        `Password must be at least ${minLength} characters long`,
        'password'
      );
    }
  }
}
