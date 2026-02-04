/**
 * Dashboard Component - Optimized React Version
 * More "React-ive" with proper hooks optimization
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ApiService } from '../services/api';
import { getUserData, stateManager } from '../services/storage';
import { getTodayCode, getMinutesFrom7AM } from '../utils/time';
import { getCourseColor } from '../utils/dom';
import '../styles/Dashboard.css';

export default function Dashboard() {
  // State for stats cards
  const [stats, setStats] = useState({
    currentCourses: '-',
    currentGWA: '-',
    totalProfessors: '-',
    currentSemester: '-',
  });

  // State for today's schedule
  const [todayClasses, setTodayClasses] = useState([]);
  
  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  
  // Error states
  const [statsError, setStatsError] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);
  
  // Load counter to prevent race conditions
  const loadCounterRef = useRef(0);

  /**
   * Loads GWA (Grade Weighted Average) and current semester
   * Memoized to prevent recreation on every render
   */
  const loadGWA = useCallback(async (myLoadId) => {
    try {
      const userData = getUserData();
      const studentInfo = stateManager.get('studentInfo');
      
      if (!studentInfo?.idDepartment) {
        throw new Error('Department information not available');
      }

      const endpoint = `/api/studentgradefile/student/${userData.studentId}/department/${studentInfo.idDepartment}`;
      const result = await ApiService.get(endpoint);

      // Race condition check
      if (myLoadId !== loadCounterRef.current) return;

      if (result.status === 200 && result.data?.items) {
        const enrollments = result.data.items.studentEnrollments || [];

        if (enrollments.length > 0) {
          const current = enrollments[0];
          setStats(prev => ({
            ...prev,
            currentGWA: current.gwa && current.gwa > 0 ? current.gwa.toFixed(2) : 'N/A',
            currentSemester: current.term || 'N/A',
          }));
        } else {
          setStats(prev => ({
            ...prev,
            currentGWA: 'N/A',
            currentSemester: 'N/A',
          }));
        }
      } else {
        setStats(prev => ({
          ...prev,
          currentGWA: 'N/A',
          currentSemester: 'N/A',
        }));
      }
    } catch (error) {
      console.error('Error loading GWA:', error);
      if (myLoadId === loadCounterRef.current) {
        setStats(prev => ({
          ...prev,
          currentGWA: 'N/A',
          currentSemester: 'N/A',
        }));
      }
    }
  }, []); // No dependencies - function never recreated

  /**
   * Loads dashboard statistics (courses, professors)
   * Memoized to prevent recreation on every render
   */
  const loadStats = useCallback(async (myLoadId) => {
    try {
      const userData = getUserData();
      const currentAcademicYearId = stateManager.get('currentAcademicYearId');
      const currentTermId = stateManager.get('currentTermId');

      if (!currentAcademicYearId || !currentTermId) {
        throw new Error('Academic context not initialized');
      }

      // Fetch schedule to get course count and professors
      const endpoint = `/api/student/${userData.studentId}/${currentAcademicYearId}/${currentTermId}/schedule`;
      const result = await ApiService.get(endpoint);

      // Race condition check
      if (myLoadId !== loadCounterRef.current) return;

      if (result.status === 200 && result.data?.items) {
        const courses = result.data.items;
        const uniqueProfessors = new Set(courses.map(c => c.instructor));

        setStats(prev => ({
          ...prev,
          currentCourses: courses.length,
          totalProfessors: uniqueProfessors.size,
        }));
      } else {
        setStats(prev => ({
          ...prev,
          currentCourses: 'N/A',
          totalProfessors: 'N/A',
        }));
      }

      // Load GWA
      await loadGWA(myLoadId);

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      if (myLoadId === loadCounterRef.current) {
        setStatsError('Failed to load statistics');
        setStats({
          currentCourses: 'Error',
          currentGWA: 'Error',
          totalProfessors: 'Error',
          currentSemester: 'Error',
        });
      }
    } finally {
      if (myLoadId === loadCounterRef.current) {
        setIsLoadingStats(false);
      }
    }
  }, [loadGWA]); // Depends on loadGWA

  /**
   * Loads today's class schedule
   * Memoized to prevent recreation on every render
   */
  const loadTodaySchedule = useCallback(async (myLoadId) => {
    try {
      const userData = getUserData();
      const currentAcademicYearId = stateManager.get('currentAcademicYearId');
      const currentTermId = stateManager.get('currentTermId');

      if (!currentAcademicYearId || !currentTermId) {
        throw new Error('Cannot load schedule - academic data not available');
      }

      const endpoint = `/api/student/${userData.studentId}/${currentAcademicYearId}/${currentTermId}/schedule`;
      const result = await ApiService.get(endpoint);

      // Race condition check
      if (myLoadId !== loadCounterRef.current) return;

      if (result.status === 200 && result.data?.items) {
        const allCourses = result.data.items;
        const todayCode = getTodayCode();

        // Filter courses that have classes today
        const todayCourses = [];
        allCourses.forEach(course => {
          course.schedule.forEach(sched => {
            const hasToday = sched.day.some(d => d.code === todayCode);
            if (hasToday) {
              todayCourses.push({ course, schedule: sched });
            }
          });
        });

        setTodayClasses(todayCourses);
      } else {
        setScheduleError('Unable to load today\'s schedule');
      }
    } catch (error) {
      console.error('Error loading today\'s schedule:', error);
      if (myLoadId === loadCounterRef.current) {
        setScheduleError(error.message || 'Failed to load schedule');
      }
    } finally {
      if (myLoadId === loadCounterRef.current) {
        setIsLoadingSchedule(false);
      }
    }
  }, []); // No dependencies

  /**
   * Loads all dashboard data in parallel
   * Memoized to prevent recreation on every render
   */
  const loadDashboardData = useCallback(async (myLoadId) => {
    await Promise.all([
      loadStats(myLoadId),
      loadTodaySchedule(myLoadId)
    ]);
  }, [loadStats, loadTodaySchedule]);

  /**
   * Sort today's classes by time
   * Memoized so it only recalculates when todayClasses changes
   */
  const sortedTodayClasses = useMemo(() => {
    return [...todayClasses].sort((a, b) => {
      const timeA = getMinutesFrom7AM(a.schedule.timeFrom);
      const timeB = getMinutesFrom7AM(b.schedule.timeFrom);
      return timeA - timeB;
    });
  }, [todayClasses]);

  /**
   * Component mount - load all dashboard data
   */
  useEffect(() => {
    // Verify academic context is initialized
    if (!stateManager.hasValidSession()) {
      const error = 'Academic context not initialized. Please log in again.';
      setStatsError(error);
      setScheduleError(error);
      setIsLoadingStats(false);
      setIsLoadingSchedule(false);
      return;
    }

    const myLoadId = ++loadCounterRef.current;
    loadDashboardData(myLoadId);
  }, [loadDashboardData]);

  return (
    <div className="dashboard-section-wrapper" id="dashboardSection">
      <h2 className="section-title">📊 Dashboard</h2>

      {/* Stats Grid */}
      {statsError ? (
        <div className="error-message">{statsError}</div>
      ) : (
        <div className="stats-grid">
          <StatCard icon="📚" value={stats.currentCourses} label="Current Courses" />
          <StatCard icon="⭐" value={stats.currentGWA} label="Current GWA" />
          <StatCard icon="👨‍🏫" value={stats.totalProfessors} label="Professors" />
          <StatCard icon="📅" value={stats.currentSemester} label="Current Semester" />
        </div>
      )}

      {/* Today's Classes Section */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Today's Classes</h3>
        <div id="todaySchedulePreview">
          {isLoadingSchedule ? (
            <LoadingSpinner message="Loading today's schedule..." />
          ) : scheduleError ? (
            <ErrorMessage message={scheduleError} />
          ) : sortedTodayClasses.length === 0 ? (
            <NoClasses />
          ) : (
            <TodayClassesList classes={sortedTodayClasses} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component - Extracted for better React composition
 * Memoized to prevent unnecessary re-renders
 */
const StatCard = React.memo(({ icon, value, label }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
));

/**
 * Loading Spinner Component
 */
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="loading">
    <div className="loading-spinner"></div>
    <div>{message}</div>
  </div>
);

/**
 * Error Message Component
 */
const ErrorMessage = ({ message }) => (
  <div className="error-message">{message}</div>
);

/**
 * No Classes Component
 */
const NoClasses = () => (
  <div className="no-classes">🎉 No classes today!</div>
);

/**
 * Today's Classes List Component
 * Memoized to prevent unnecessary re-renders
 */
const TodayClassesList = React.memo(({ classes }) => (
  <div className="today-classes-list">
    {classes.map(({ course, schedule }, index) => {
      const color = getCourseColor(course.courseCode);
      return (
        <div 
          key={`${course.courseCode}-${index}`}
          className="today-class-card" 
          style={{ borderLeftColor: color }}
        >
          <div className="today-class-time">
            {schedule.timeFrom} - {schedule.timeTo}
          </div>
          <div className="today-class-code">
            {course.courseCode} - {course.section || 'N/A'}
          </div>
          <div className="today-class-name">{course.description}</div>
          <div className="today-class-details">
            <span>📍 {schedule.roomName}</span>
            <span>👨‍🏫 {course.instructor}</span>
          </div>
        </div>
      );
    })}
  </div>
));
