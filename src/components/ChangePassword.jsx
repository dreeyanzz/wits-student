import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../services/api';
import { Validator } from '../utils/validation';
import { CONFIG } from '../config/constants';
import { SectionHeader } from './shared';
import '../styles/ChangePassword.css';

function ChangePassword() {
  const [step, setStep] = useState(1); // 1: password fields, 2: OTP
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const storedOldPasswordRef = useRef('');
  const storedNewPasswordRef = useRef('');
  const timerIntervalRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!otpExpiresAt) return;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, otpExpiresAt - now);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(timerIntervalRef.current);
        setError('OTP expired. Please start over.');
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [otpExpiresAt]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleRequestOtp = async () => {
    clearMessages();

    // Validate inputs
    try {
      Validator.required(oldPassword, 'Current password');
      Validator.required(newPassword, 'New password');
      Validator.required(confirmPassword, 'Confirm password');
      Validator.password(newPassword);

      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match');
        return;
      }

      if (oldPassword === newPassword) {
        setError('New password must be different from current password');
        return;
      }
    } catch (err) {
      setError(err.message);
      return;
    }

    // Store passwords for later use
    storedOldPasswordRef.current = oldPassword;
    storedNewPasswordRef.current = newPassword;

    setLoading(true);

    try {
      const result = await ApiService.post(
        '/api/usermaster/student/otp',
        {
          oldPassword: oldPassword,
          newPassword: newPassword
        },
        CONFIG.LOGIN_URL
      );

      if (result.status === 200) {
        setSuccess(result.data.message || 'OTP sent to your email successfully!');
        setTimeRemaining(300000); // Initialize before setting expiry to avoid "expired" flash
        setStep(2);
        setOtpExpiresAt(Date.now() + 300000); // 5 minutes
      } else {
        let errorMessage = 'Failed to send OTP. Please try again.';

        if (result.status === 429) {
          errorMessage = 'Too many requests. Please wait 5 minutes before requesting another OTP.';
        } else if (result.data?.message) {
          errorMessage = result.data.message;
        } else if (result.status === 400) {
          errorMessage = 'Invalid password. Please check your current password.';
        } else if (result.status === 401) {
          errorMessage = 'Current password is incorrect.';
        }

        setError(errorMessage);
      }
    } catch (err) {
      let errorMessage = 'Unable to connect. Please check your internet connection and try again.';

      if (err.message && !err.message.includes('HTTP') && !err.message.includes('Failed to fetch')) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPasswordChange = async () => {
    clearMessages();

    // Validate OTP
    try {
      Validator.required(otp, 'OTP');

      if (!/^\d{6}$/.test(otp)) {
        setError('OTP must be a 6-digit number');
        return;
      }
    } catch (err) {
      setError(err.message);
      return;
    }

    // Check if we have stored passwords
    if (!storedOldPasswordRef.current || !storedNewPasswordRef.current) {
      setError('Session expired. Please start over.');
      handleStartOver();
      return;
    }

    setLoading(true);

    try {
      const result = await ApiService.post(
        '/api/usermaster/student/changepassword',
        {
          oneTimePassword: otp,
          oldPassword: storedOldPasswordRef.current,
          newPassword: storedNewPasswordRef.current
        },
        CONFIG.LOGIN_URL
      );

      if (result.status === 200) {
        setSuccess(result.data.message || 'Password changed successfully!');
        
        // Reset form after 2 seconds
        setTimeout(() => {
          handleStartOver();
        }, 2000);
      } else {
        let errorMessage = 'Failed to change password. Please try again.';

        if (result.data?.message) {
          errorMessage = result.data.message;
        } else if (result.status === 400) {
          errorMessage = 'Invalid or expired OTP. Please check the code and try again.';
        }

        setError(errorMessage);
      }
    } catch (err) {
      let errorMessage = 'The OTP you entered is incorrect or has expired. Please try again.';

      if (err.message && err.message.includes('incorrect')) {
        errorMessage = err.message;
      } else if (err.message && err.message.includes('expired')) {
        errorMessage = 'Your OTP has expired. Please request a new one.';
      } else if (err.message && !err.message.includes('HTTP') && !err.message.includes('Failed to fetch')) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccess('');
    setLoading(false);
    setOtpExpiresAt(null);
    setTimeRemaining(0);
    storedOldPasswordRef.current = '';
    storedNewPasswordRef.current = '';
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isOtpExpired = timeRemaining === 0 && otpExpiresAt !== null;
  const isOtpExpiringSoon = timeRemaining < 60000; // Less than 1 minute

  return (
    <div className="section">
      <SectionHeader icon="🔐" title="Change Password" />

      <div className="change-password-form">
        {error && (
          <div className="form-error">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            ✅ {success}
          </div>
        )}

        {step === 1 && (
          <>
            <div id="passwordFields">
              <div className="form-group">
                <label htmlFor="oldPassword">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    id="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    aria-label="Toggle password visibility"
                  >
                    <span>{showOldPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password (min. 6 characters)"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label="Toggle password visibility"
                  >
                    <span>{showNewPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle password visibility"
                  >
                    <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              className="btn-success"
              onClick={handleRequestOtp}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Request OTP'}
            </button>
          </>
        )}

        {step === 2 && (
          <div className="otp-section">
            <div className="otp-info">
              <p>📧 A 6-digit OTP has been sent to your registered email.</p>
              {!isOtpExpired && (
                <p
                  className="otp-timer"
                  style={{
                    color: isOtpExpiringSoon ? 'var(--status-warning)' : 'var(--color-tertiary)'
                  }}
                >
                  OTP expires in {formatTime(timeRemaining)}
                </p>
              )}
              {isOtpExpired && (
                <p className="otp-timer" style={{ color: 'var(--status-error)' }}>
                  ⏰ <strong>Time's up!</strong> Your OTP has expired.
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="otpInput">Enter OTP</label>
              <input
                type="text"
                id="otpInput"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                pattern="\d{6}"
                autoComplete="one-time-code"
                disabled={isOtpExpired}
              />
            </div>

            <button
              className="btn-success"
              onClick={handleSubmitPasswordChange}
              disabled={loading || isOtpExpired}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>

            <button
              className="btn-cancel"
              onClick={handleStartOver}
              style={{ marginTop: '10px' }}
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChangePassword;
