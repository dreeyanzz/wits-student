import React from 'react';
import citLogo from '../assets/cit-logo.png';
import '../styles/Login.css';

const SessionRestoreOverlay = ({ message = 'Restoring your session...' }) => {
  return (
    <div className="session-restore-overlay">
      <div className="session-restore-content">
        <img 
          src={citLogo} 
          alt="CIT-U Logo" 
          className="session-restore-logo" 
        />
        <div className="session-restore-spinner"></div>
        <div className="session-restore-text">{message}</div>
      </div>
    </div>
  );
};

export default SessionRestoreOverlay;
