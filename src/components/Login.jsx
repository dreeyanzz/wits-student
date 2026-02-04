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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    setLoading(true);

    try {
      const result = await AuthService.login(userId.trim(), password);
      
      // Call success callback
      if (onLoginSuccess) {
        await onLoginSuccess(result.userData);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.name === 'AuthenticationError') {
        errorMessage = error.message;
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  return (
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
            <label htmlFor="userId">Student ID</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={handleUserIdChange}
              placeholder="24-4339-705"
              disabled={loading}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                disabled={loading}
                required
                autoComplete="current-password"
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
  );
};

export default Login;
