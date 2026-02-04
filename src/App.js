import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import SessionRestoreOverlay from './components/SessionRestoreOverlay';
import { AuthService } from './services/auth';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Try to restore session on mount
    const restoreSession = async () => {
      try {
        const result = await AuthService.restoreSession();
        if (result.success) {
          setIsAuthenticated(true);
          setUserData(result.userData);
        }
      } catch (error) {
        console.error('Session restore error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLoginSuccess = async (userData) => {
    setUserData(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUserData(null);
  };

  if (isLoading) {
    return <SessionRestoreOverlay />;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Welcome, {userData?.fullName || 'Student'}!</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>
      <main className="app-main">
        <p>Dashboard will be implemented here.</p>
        <p>Student ID: {userData?.userId}</p>
      </main>
    </div>
  );
}

export default App;
