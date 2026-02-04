import { useState, useEffect } from 'react';
import Login from './components/Login';
import SessionRestoreOverlay from './components/SessionRestoreOverlay';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Grades from './components/Grades';
import Professors from './components/Professors';
import CourseOfferings from './components/CourseOfferings';
import { AuthService } from './services/auth';
import { initializeTimeSlots } from './config/constants';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHamburger, setShowHamburger] = useState(false);

  useEffect(() => {
    // Initialize time slots on app mount
    initializeTimeSlots();

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
    setShowLogoutModal(false);
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setShowHamburger(false);
  };

  if (isLoading) {
    return <SessionRestoreOverlay />;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Application Header */}
      <header className="header">
        <div className="header-left">
          <img
            src="/cit-official-seal.png"
            alt="Wildcat One - CIT-U Student Portal"
            className="cit-logo"
          />
          <div className="title-text">
            <div className="wildcat-one-logo">Wildcat One</div>
            <div className="subtitle">One space for all</div>
          </div>
        </div>
        <div className="user-info">
          <div className="user-name">{userData?.fullName || '-'}</div>
          <div className="user-id">{userData?.userId || '-'}</div>
          <button 
            className="logout-btn" 
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Quick Actions */}
      <section className="section quick-actions-section">
        <h2 className="section-title">⚡ Quick Actions</h2>
        <div className="button-group">
          <button 
            className="btn-success" 
            onClick={() => handleNavigation('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className="btn-success" 
            onClick={() => handleNavigation('schedule')}
          >
            📅 View Schedule
          </button>
          <button 
            className="btn-success" 
            onClick={() => handleNavigation('grades')}
          >
            📊 View Grades
          </button>
          <button 
            className="btn-success" 
            onClick={() => handleNavigation('professors')}
          >
            👨‍🏫 View Professors
          </button>
          <button 
            className="btn-success" 
            onClick={() => handleNavigation('offerings')}
          >
            🔍 View Course Offerings
          </button>
          <button 
            className="btn-success" 
            onClick={() => handleNavigation('changePassword')}
          >
            🔐 Change Password
          </button>
        </div>
      </section>

      {/* Floating Hamburger Menu (Mobile Only) */}
      <div className="floating-hamburger">
        <div 
          className={`hamburger-overlay ${showHamburger ? 'active' : ''}`}
          onClick={() => setShowHamburger(false)}
        ></div>
        <button 
          className={`hamburger-btn ${showHamburger ? 'active' : ''}`}
          onClick={() => setShowHamburger(!showHamburger)}
          aria-label="Menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <nav className={`hamburger-menu ${showHamburger ? 'active' : ''}`}>
          <button 
            className="hamburger-menu-item" 
            onClick={() => handleNavigation('dashboard')}
          >
            <span className="menu-icon">📊</span>
            <span className="menu-label">Dashboard</span>
          </button>
          <button 
            className="hamburger-menu-item" 
            onClick={() => handleNavigation('schedule')}
          >
            <span className="menu-icon">📅</span>
            <span className="menu-label">View Schedule</span>
          </button>
          <button 
            className="hamburger-menu-item" 
            onClick={() => handleNavigation('grades')}
          >
            <span className="menu-icon">📊</span>
            <span className="menu-label">View Grades</span>
          </button>
          <button 
            className="hamburger-menu-item" 
            onClick={() => handleNavigation('professors')}
          >
            <span className="menu-icon">👨‍🏫</span>
            <span className="menu-label">View Professors</span>
          </button>
          <button 
            className="hamburger-menu-item" 
            onClick={() => handleNavigation('offerings')}
          >
            <span className="menu-icon">🔍</span>
            <span className="menu-label">View Course Offerings</span>
          </button>
          <button 
            className="hamburger-menu-item" 
            onClick={() => handleNavigation('changePassword')}
          >
            <span className="menu-icon">🔐</span>
            <span className="menu-label">Change Password</span>
          </button>
          <div className="hamburger-divider"></div>
          <button 
            className="hamburger-menu-item hamburger-logout"
            onClick={() => {
              setShowHamburger(false);
              setShowLogoutModal(true);
            }}
          >
            <span className="menu-icon">🚪</span>
            <span className="menu-label">Logout</span>
          </button>
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <div className="logout-modal-icon">🚪</div>
            <h3 className="logout-modal-title">Confirm Logout</h3>
            <p className="logout-modal-text">Are you sure you want to log out?</p>
            <div className="logout-modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm-logout" 
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      {activeSection === 'dashboard' && <Dashboard />}
      {activeSection === 'schedule' && <Schedule />}
      {activeSection === 'grades' && <Grades />}
      {activeSection === 'professors' && <Professors />}
      {activeSection === 'offerings' && <CourseOfferings />}
      {activeSection === 'changePassword' && (
        <div className="section">
          <h2 className="section-title">🔐 Change Password</h2>
          <p>Change Password section coming soon...</p>
        </div>
      )}
    </div>
  );
}

export default App;
