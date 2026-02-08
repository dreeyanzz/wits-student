/**
 * ForgotPassword Component - React
 * Password reset flow using student ID and birthdate
 */

import React, { useState } from 'react';
import { AuthService } from '../services/auth';
import citLogo from '../assets/cit-logo.png';
import '../styles/ForgotPassword.css';

const ForgotPassword = ({ onBackToLogin }) => {
  const [studentId, setStudentId] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentIdError, setStudentIdError] = useState(false);
  const [birthdateError, setBirthdateError] = useState(false);

  /**
   * Handles password reset submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedStudentId = studentId.trim();
    const trimmedBirthdate = birthdate.trim();

    clearMessages();
    setLoading(true);

    try {
      const result = await AuthService.forgotPassword(trimmedStudentId, trimmedBirthdate);
      
      if (result.success) {
        setSuccess(result.message || 'Password reset is successful. Please check your email.');
        // Clear form
        setStudentId('');
        setBirthdate('');
      }
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Password reset failed. Please try again.';
      
      if (error.name === 'ValidationError') {
        errorMessage = error.message;
        if (error.message.toLowerCase().includes('student id')) {
          setStudentIdError(true);
        } else if (error.message.toLowerCase().includes('birthdate')) {
          setBirthdateError(true);
        }
      } else if (error.name === 'ApiError') {
        if (error.statusCode === 404) {
          errorMessage = 'Record does not exist. Please check your Student ID and birthdate.';
          setStudentIdError(true);
          setBirthdateError(true);
        } else if (error.statusCode === 0) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = 'Unable to connect to server. Please try again.';
        }
      }
      
      setError(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears all messages and field highlighting
   */
  const clearMessages = () => {
    setError('');
    setSuccess('');
    setStudentIdError(false);
    setBirthdateError(false);
  };

  /**
   * Handles student ID input change
   */
  const handleStudentIdChange = (e) => {
    setStudentId(e.target.value);
    if (error || success) clearMessages();
  };

  /**
   * Handles birthdate input change
   */
  const handleBirthdateChange = (e) => {
    setBirthdate(e.target.value);
    if (error || success) clearMessages();
  };

  /**
   * Handles back to login
   */
  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    }
  };

  return (
    <div className="forgot-password-card">
          <div className="forgot-password-header">
            <div className="forgot-password-title">
              <img
                src={citLogo}
                alt="Wildcat One - CIT-U Student Portal"
                className="cit-logo"
              />
              <div className="wildcat-one-branding">Wildcat One</div>
            </div>
            <div className="forgot-password-subtitle">Reset Password</div>
            <div className="forgot-password-description">
              Enter your Student ID and birthdate to reset your password
            </div>
          </div>

          {error && (
            <div className="forgot-password-error">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="forgot-password-success">
              ✅ {success}
            </div>
          )}

          <form className="forgot-password-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="studentId">Student ID</label>
              <input
                type="text"
                id="studentId"
                value={studentId}
                onChange={handleStudentIdChange}
                placeholder="24-4339-705"
                disabled={loading}
                required
                className={studentIdError ? 'form-input--error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="birthdate">Birthdate</label>
              <input
                type="date"
                id="birthdate"
                value={birthdate}
                onChange={handleBirthdateChange}
                disabled={loading}
                required
                className={birthdateError ? 'form-input--error' : ''}
              />
              <div className="form-hint">Select your date of birth</div>
            </div>

            <button 
              type="submit" 
              className="reset-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Reset Password'}
            </button>

            <button
              type="button"
              className="back-to-login-btn"
              onClick={handleBackToLogin}
              disabled={loading}
            >
              Back to Login
            </button>
          </form>
    </div>
  );
};

export default ForgotPassword;
