/**
 * Login Component - React Migration
 * Replicated from wildcat-one/js/components/Login.js
 */

import React, { useState } from 'react';
import { AuthService } from '../services/auth';
import citLogo from '../assets/cit-logo.png';
import '../styles/Login.css';
import '../styles/FlipTransition.css';

const Login = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [userIdError, setUserIdError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [birthdateError, setBirthdateError] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [textKey, setTextKey] = useState(0); // Key to trigger text animation

  /**
   * Processes login attempt with authentication and overlay animation
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedUserId = userId.trim();
    const trimmedPassword = password;

    clearError();
    setLoading(true);

    try {
      // First authenticate - this will throw if invalid
      const result = await AuthService.login(trimmedUserId, trimmedPassword);
      
      // Only show overlay/transition if login was successful
      // Wait a moment for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Call success callback if set
      if (onLoginSuccess) {
        await onLoginSuccess(result.userData);
      }
      
    } catch (error) {
      // Login failed - don't show overlay, just show error
      console.error('Login error:', error);
      
      // Get user-friendly error message
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.name === 'AuthenticationError') {
        errorMessage = error.message;
        // Highlight password field for wrong credentials
        setPasswordError(true);
      } else if (error.name === 'ValidationError') {
        errorMessage = error.message;
      } else if (error.name === 'ApiError') {
        if (error.statusCode === 0) {
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
   * Toggles password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Clears error/success messages and field highlighting
   */
  const clearError = () => {
    setError('');
    setSuccess('');
    setUserIdError(false);
    setPasswordError(false);
    setBirthdateError(false);
  };

  /**
   * Handles user ID input change
   */
  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    if (error) clearError();
  };

  /**
   * Handles password input change
   */
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error || success) clearError();
  };

  /**
   * Handles birthdate input change
   */
  const handleBirthdateChange = (e) => {
    setBirthdate(e.target.value);
    if (error || success) clearError();
  };

  /**
   * Handles password reset submission
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const trimmedUserId = userId.trim();
    const trimmedBirthdate = birthdate.trim();

    clearError();
    setLoading(true);

    try {
      const result = await AuthService.forgotPassword(trimmedUserId, trimmedBirthdate);
      
      if (result.success) {
        setSuccess(result.message || 'Password reset is successful. Please check your email.');
        // Clear form
        setUserId('');
        setBirthdate('');
      }
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Password reset failed. Please try again.';
      
      if (error.name === 'ValidationError') {
        errorMessage = error.message;
        if (error.message.toLowerCase().includes('student id')) {
          setUserIdError(true);
        } else if (error.message.toLowerCase().includes('birthdate')) {
          setBirthdateError(true);
        }
      } else if (error.name === 'ApiError') {
        if (error.statusCode === 404) {
          errorMessage = 'Record does not exist. Please check your Student ID and birthdate.';
          setUserIdError(true);
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
   * Shows forgot password mode (flips password field to birthdate)
   */
  const handleForgotPassword = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowForgotPassword(true);
      setTextKey(prev => prev + 1); // Trigger text animation
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  /**
   * Returns to login mode (flips birthdate field back to password)
   */
  const handleBackToLogin = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowForgotPassword(false);
      setTextKey(prev => prev + 1); // Trigger text animation
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className={`login-card ${showForgotPassword ? 'reset-mode' : 'login-mode'}`}>
          <div className="login-header">
            <div className="login-title">
              <img
                src={citLogo}
                alt="Wildcat One - CIT-U Student Portal"
                className="cit-logo"
              />
              <div className="wildcat-one-branding">Wildcat One</div>
            </div>
            <div className="login-subtitle">
              <span key={`subtitle-${textKey}`} className="text-slide-enter">
                {showForgotPassword ? 'Reset Password' : 'Student Portal'}
              </span>
            </div>
            <div className="login-description">
              <span key={`description-${textKey}`} className="text-slide-enter">
                {showForgotPassword 
                  ? 'Enter your Student ID and birthdate to reset your password'
                  : 'Virtus in Scientia et Tecnologia'
                }
              </span>
            </div>
          </div>

          {error && (
            <div className="login-error">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="login-success">
              ✅ {success}
            </div>
          )}

          <form className="login-form" onSubmit={showForgotPassword ? handleResetPassword : handleSubmit}>
            <div className="form-group">
              <label htmlFor="loginUserId">Student ID</label>
              <input
                type="text"
                id="loginUserId"
                value={userId}
                onChange={handleUserIdChange}
                placeholder="24-4339-705"
                disabled={loading}
                required
                autoComplete="username"
                className={userIdError ? 'form-input--error' : ''}
              />
            </div>

            {/* Flip Container for Password/Birthdate field */}
            <div className="form-group">
              <div className={`field-flip-container ${showForgotPassword ? 'flipped' : ''}`}>
                <div className="field-flipper">
                  {/* Front - Password Field */}
                  <div className="field-flip-front">
                    <label htmlFor="loginPassword">Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="loginPassword"
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Enter your password"
                        disabled={loading || showForgotPassword}
                        required={!showForgotPassword}
                        autoComplete="current-password"
                        className={passwordError ? 'form-input--error' : ''}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={togglePasswordVisibility}
                        aria-label="Toggle password visibility"
                        disabled={showForgotPassword}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Back - Birthdate Field */}
                  <div className="field-flip-back">
                    <label htmlFor="birthdate">Birthdate</label>
                    <input
                      type="date"
                      id="birthdate"
                      value={birthdate}
                      onChange={handleBirthdateChange}
                      disabled={loading || !showForgotPassword}
                      required={showForgotPassword}
                      className={birthdateError ? 'form-input--error' : ''}
                    />
                    <div className="form-hint">Select your date of birth</div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? (showForgotPassword ? 'Sending...' : 'Authenticating...') : (showForgotPassword ? 'Reset Password' : 'Sign In')}
            </button>

            <div className="forgot-password-link-container">
              <button
                type="button"
                className="forgot-password-link"
                onClick={showForgotPassword ? handleBackToLogin : handleForgotPassword}
                disabled={loading}
              >
                {showForgotPassword ? 'Back to Login' : 'Forgot Password?'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
