import { useState, useEffect } from 'react';
import Login from './components/Login';
import SessionRestoreOverlay from './components/SessionRestoreOverlay';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Grades from './components/Grades';
import Professors from './components/Professors';
import CourseOfferings from './components/CourseOfferings';
import ChangePassword from './components/ChangePassword';
import ErrorBoundary from './components/shared/ErrorBoundary';
import SlowConnectionBanner from './components/shared/SlowConnectionBanner';
import { useSlowConnection } from './hooks/useSlowConnection';
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
  const [overlayText, setOverlayText] = useState('Restoring your session...');
  const [showOverlay, setShowOverlay] = useState(false);
  const [showHamburgerOnScroll, setShowHamburgerOnScroll] = useState(false);
  const { isConnectionSlow, isOffline } = useSlowConnection();

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

  // Effect: Hamburger scroll detection for desktop
  useEffect(() => {
    const checkScroll = () => {
      if (window.innerWidth > 768) {
        const quickActions = document.querySelector('.quick-actions-section');
        if (quickActions) {
          const rect = quickActions.getBoundingClientRect();
          setShowHamburgerOnScroll(rect.bottom < 0);
        }
      } else {
        setShowHamburgerOnScroll(false);
      }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    window.addEventListener('wheel', checkScroll, { passive: true });
    checkScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      window.removeEventListener('wheel', checkScroll);
    };
  }, []);

  // Effect: Body scroll prevention when hamburger is open
  useEffect(() => {
    if (showHamburger) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showHamburger]);

  // Effect: Event listeners for closing hamburger menu
  useEffect(() => {
    if (!showHamburger) return;

    const handleClickOutside = (e) => {
      const menu = document.querySelector('.hamburger-menu');
      const btn = document.querySelector('.hamburger-btn');
      if (!menu?.contains(e.target) && !btn?.contains(e.target)) {
        setShowHamburger(false);
      }
    };

    const handleScroll = () => {
      setShowHamburger(false);
    };

    const handleWheel = (e) => {
      const menu = document.querySelector('.hamburger-menu');
      if (!menu?.contains(e.target)) {
        setShowHamburger(false);
      }
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        setShowHamburger(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [showHamburger]);

  const handleLoginSuccess = async (userData) => {
    setOverlayText('Loading dashboard...');
    setShowOverlay(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setUserData(userData);
    setIsAuthenticated(true);
    setShowOverlay(false);
    setOverlayText('Restoring your session...');
  };

  const handleLogout = async () => {
    setOverlayText('Logging out...');
    setShowOverlay(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    AuthService.logout();
    setIsAuthenticated(false);
    setUserData(null);
    setShowLogoutModal(false);
    setShowOverlay(false);
    setOverlayText('Restoring your session...');
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setShowHamburger(false);
  };

  if (isLoading || showOverlay) {
    return <SessionRestoreOverlay text={overlayText} />;
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
          <div className="user-id">{userData?.studentIdNumber || '-'}</div>
          <button 
            className="logout-btn" 
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </button>
        </div>
      </header>

      <SlowConnectionBanner visible={isConnectionSlow} isOffline={isOffline} />

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
      <div className={`floating-hamburger ${showHamburgerOnScroll ? 'show-on-scroll' : ''}`}>
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
            className={`hamburger-menu-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigation('dashboard')}
          >
            <span className="menu-icon">📊</span>
            <span className="menu-label">Dashboard</span>
          </button>
          <button 
            className={`hamburger-menu-item ${activeSection === 'schedule' ? 'active' : ''}`}
            onClick={() => handleNavigation('schedule')}
          >
            <span className="menu-icon">📅</span>
            <span className="menu-label">View Schedule</span>
          </button>
          <button 
            className={`hamburger-menu-item ${activeSection === 'grades' ? 'active' : ''}`}
            onClick={() => handleNavigation('grades')}
          >
            <span className="menu-icon">📊</span>
            <span className="menu-label">View Grades</span>
          </button>
          <button 
            className={`hamburger-menu-item ${activeSection === 'professors' ? 'active' : ''}`}
            onClick={() => handleNavigation('professors')}
          >
            <span className="menu-icon">👨‍🏫</span>
            <span className="menu-label">View Professors</span>
          </button>
          <button 
            className={`hamburger-menu-item ${activeSection === 'offerings' ? 'active' : ''}`}
            onClick={() => handleNavigation('offerings')}
          >
            <span className="menu-icon">🔍</span>
            <span className="menu-label">View Course Offerings</span>
          </button>
          <button 
            className={`hamburger-menu-item ${activeSection === 'changePassword' ? 'active' : ''}`}
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

      {/* Main Content Sections - Wrapped in Error Boundary */}
      <ErrorBoundary>
        {activeSection === 'dashboard' && <Dashboard />}
        {activeSection === 'schedule' && <Schedule />}
        {activeSection === 'grades' && <Grades />}
        {activeSection === 'professors' && <Professors />}
        {activeSection === 'offerings' && <CourseOfferings />}
        {activeSection === 'changePassword' && <ChangePassword />}
      </ErrorBoundary>
    </div>
  );
}

export default App;
