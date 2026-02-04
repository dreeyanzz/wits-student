/**
 * Login Component - React Migration
 * Replicated from wildcat-one/js/components/Login.js
 */

import React, { useState } from 'react';
import { AuthService } from '../services/auth';
import citLogo from '../assets/cit-logo.png';
import '../styles/Login.css';

const Login = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userIdError, setUserIdError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

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
   * Clears error message and field highlighting
   */
  const clearError = () => {
    setError('');
    setUserIdError(false);
    setPasswordError(false);
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
    if (error) clearError();
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-title">
              <img
                src={citLogo}
                alt="Wildcat One - CIT-U Student Portal"
                className="cit-logo"
              />
              <div className="wildcat-one-branding">Wildcat One</div>
            </div>
            <div className="login-subtitle">Student Portal</div>
            <div className="login-description">Virtus in Scientia et Tecnologia</div>
          </div>

          {error && (
            <div className="login-error">
              ❌ {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
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

            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                  autoComplete="current-password"
                  className={passwordError ? 'form-input--error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
