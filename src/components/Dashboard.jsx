/**
 * Dashboard Component
 * Displays student overview: stats cards and today's schedule
 */

import { useState, useEffect, useRef } from 'react';
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
  }, []);

  /**
   * Loads all dashboard data, fetching schedule once and sharing the result
   * @param {number} myLoadId - Load identifier for race condition prevention
   */
  const loadDashboardData = async (myLoadId) => {
    const userData = getUserData();
    const currentAcademicYearId = stateManager.get('currentAcademicYearId');
    const currentTermId = stateManager.get('currentTermId');

    if (!currentAcademicYearId || !currentTermId) {
      setStatsError('Academic context not initialized');
      setScheduleError('Academic context not initialized');
      setIsLoadingStats(false);
      setIsLoadingSchedule(false);
      return;
    }

    // Fetch schedule once for both stats and today's classes
    let scheduleCourses = null;
    try {
      const endpoint = `/api/student/${userData.studentId}/${currentAcademicYearId}/${currentTermId}/schedule`;
      const result = await ApiService.get(endpoint);

      if (myLoadId !== loadCounterRef.current) return;

      if (result.status === 200 && result.data?.items) {
        scheduleCourses = result.data.items;
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }

    if (myLoadId !== loadCounterRef.current) return;

    // Process stats and today's schedule from the shared result
    await Promise.all([
      loadStats(myLoadId, scheduleCourses),
      loadTodaySchedule(myLoadId, scheduleCourses)
    ]);
  };

  /**
   * Loads dashboard statistics (courses, professors, GWA)
   * @param {number} myLoadId - Load identifier
   * @param {Array|null} scheduleCourses - Pre-fetched schedule data
   */
  const loadStats = async (myLoadId, scheduleCourses) => {
    try {
      if (scheduleCourses) {
        const uniqueProfessors = new Set(scheduleCourses.map(c => c.instructor));
        setStats(prev => ({
          ...prev,
          currentCourses: scheduleCourses.length,
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
  };

  /**
   * Loads GWA (Grade Weighted Average) and current semester
   * @param {number} myLoadId - Load identifier
   */
  const loadGWA = async (myLoadId) => {
    try {
      const userData = getUserData();
      const studentInfo = stateManager.get('studentInfo');
      
      if (!studentInfo) {
        throw new Error('Student information not available');
      }

      const departmentId = studentInfo.idDepartment;
      if (!departmentId) {
        throw new Error('Department information not available');
      }

      const endpoint = `/api/studentgradefile/student/${userData.studentId}/department/${departmentId}`;
      const result = await ApiService.get(endpoint);

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
  };

  /**
   * Loads today's class schedule
   * @param {number} myLoadId - Load identifier
   * @param {Array|null} scheduleCourses - Pre-fetched schedule data
   */
  const loadTodaySchedule = async (myLoadId, scheduleCourses) => {
    try {
      if (!scheduleCourses) {
        setScheduleError('Unable to load today\'s schedule');
        return;
      }

      if (myLoadId !== loadCounterRef.current) return;

      const todayCode = getTodayCode();

      // Filter courses that have classes today
      const todayCourses = [];
      scheduleCourses.forEach(course => {
        course.schedule.forEach(sched => {
          const hasToday = sched.day.some(d => d.code === todayCode);
          if (hasToday) {
            todayCourses.push({ course, schedule: sched });
          }
        });
      });

      // Sort by time (earliest first)
      todayCourses.sort((a, b) => {
        const timeA = getMinutesFrom7AM(a.schedule.timeFrom);
        const timeB = getMinutesFrom7AM(b.schedule.timeFrom);
        return timeA - timeB;
      });

      setTodayClasses(todayCourses);
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
  };

  return (
    <div className="section" id="dashboardSection">
      <h2 className="section-title">📊 Dashboard</h2>

      {/* Stats Grid */}
      {statsError ? (
        <div className="error-message">{statsError}</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{stats.currentCourses}</div>
              <div className="stat-label">Current Courses</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{stats.currentGWA}</div>
              <div className="stat-label">Current GWA</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalProfessors}</div>
              <div className="stat-label">Professors</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.currentSemester}</div>
              <div className="stat-label">Current Semester</div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Classes Section */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Today's Classes</h3>
        <div id="todaySchedulePreview">
          {isLoadingSchedule ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <div>Loading today's schedule...</div>
            </div>
          ) : scheduleError ? (
            <div className="error-message">{scheduleError}</div>
          ) : todayClasses.length === 0 ? (
            <div className="no-classes">🎉 No classes today!</div>
          ) : (
            <div className="today-classes-list">
              {todayClasses.map(({ course, schedule }, index) => {
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
          )}
        </div>
      </div>
    </div>
  );
}
