import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../services/api';
import { getItem } from '../services/storage';
import { isMobileDevice } from '../utils/dom';
import LoadingState from './shared/LoadingState';
import ErrorState from './shared/ErrorState';
import '../styles/Professors.css';

/**
 * Professors component - displays professor list
 */
function Professors() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [currentSemesterIndex, setCurrentSemesterIndex] = useState(0);
  const [showScrollHint, setShowScrollHint] = useState(true);
  
  const loadCounterRef = useRef(0);

  /**
   * Initial load of professors data
   */
  useEffect(() => {
    loadProfessors();
  }, []);

  /**
   * Fetches professors data (from grades endpoint)
   */
  const loadProfessors = async () => {
    const myLoadId = ++loadCounterRef.current;
    setLoading(true);
    setError(null);

    try {
      // Check if grades data is already cached
      let gradesData = getItem('gradesData');

      if (!gradesData) {
        const studentInfo = getItem('studentInfo');
        if (!studentInfo?.idDepartment) {
          throw new Error('Cannot load professors - department information not available');
        }

        const userData = getItem('userData');
        const departmentId = studentInfo.idDepartment;
        const endpoint = `/api/studentgradefile/student/${userData.studentId}/department/${departmentId}`;
        const result = await ApiService.get(endpoint);

        if (myLoadId !== loadCounterRef.current) return;

        if (result.status === 200 && result.data?.items) {
          gradesData = result.data.items;
        } else {
          setError('Failed to load data');
          setLoading(false);
          return;
        }
      }

      if (myLoadId !== loadCounterRef.current) return;

      const enrollments = gradesData?.studentEnrollments || [];
      setAllEnrollments(enrollments);

      if (enrollments.length > 0) {
        setCurrentSemesterIndex(0);
      } else {
        setError('No professor data available');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading professors:', err);
      if (myLoadId === loadCounterRef.current) {
        setError(err.message || 'Failed to load professors');
        setLoading(false);
      }
    }
  };

  /**
   * Handles semester selection change
   */
  const handleSemesterChange = (e) => {
    const index = parseInt(e.target.value, 10);
    setCurrentSemesterIndex(index);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="section">
        <h2 className="section-title">👨‍🏫 My Professors</h2>
        <LoadingState message="Loading professors..." />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="section">
        <h2 className="section-title">👨‍🏫 My Professors</h2>
        <ErrorState message={error} onRetry={loadProfessors} />
      </div>
    );
  }

  const enrollment = allEnrollments[currentSemesterIndex];
  if (!enrollment) {
    return (
      <div className="section">
        <h2 className="section-title">👨‍🏫 My Professors</h2>
        <div className="loading">No data available</div>
      </div>
    );
  }

  const courses = enrollment.enrolledCourseGradeDetails || enrollment.studentGradeHistoryData || [];

  return (
    <div className="section">
      <div className="professors-header">
        <h2 className="section-title no-margin">👨‍🏫 My Professors</h2>
        <div className="semester-selector">
          <label htmlFor="professorSemesterSelect">Semester:</label>
          <select 
            id="professorSemesterSelect"
            value={currentSemesterIndex}
            onChange={handleSemesterChange}
          >
            {allEnrollments.map((enroll, index) => {
              const schoolYear = enroll.academicYear || 'N/A';
              const semester = enroll.term || 'N/A';
              const yearLevel = enroll.yearLevel || '';
              return (
                <option key={index} value={index}>
                  {schoolYear}: {semester}{yearLevel ? ` (${yearLevel})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="semester-info">
        <div className="semester-info-title">Semester Information</div>
        <div className="semester-info-text">
          School Year: {enrollment.academicYear || 'N/A'} | 
          Semester: {enrollment.term || 'N/A'} | 
          Year Level: {enrollment.yearLevel || 'N/A'}
        </div>
      </div>

      {/* Scroll hint for mobile */}
      {isMobileDevice() && showScrollHint && (
        <div className="scroll-hint">
          ☜ Swipe to see all columns ☞
        </div>
      )}

      <div 
        className="table-container"
        onScroll={() => setShowScrollHint(false)}
      >
        <table className="professors-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Course Code</th>
              <th>Course Title</th>
              <th style={{ width: '300px' }}>Professor</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => {
              const professor = course.professor || 'No instructor assigned';
              return (
                <tr key={index}>
                  <td>
                    <span className="course-code">{course.courseCode || '-'}</span>
                  </td>
                  <td className="course-title">{course.courseTitle || '-'}</td>
                  <td>
                    <span className="professor-name">{professor}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Professors;
