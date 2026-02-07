import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../services/api';
import { getItem } from '../services/storage';
import { LoadingState, ErrorState, SectionHeader, SemesterSelector, ScrollHint, EmptyState } from './shared';
import { useScrollHint } from '../hooks/useScrollHint';
import '../styles/Professors.css';

/**
 * Professors component - displays professor list
 */
function Professors() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [currentSemesterIndex, setCurrentSemesterIndex] = useState(0);
  const { showHint, handleScroll: handleScrollHint } = useScrollHint();
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

  // Render loading state
  if (loading) {
    return (
      <div className="section">
        <SectionHeader icon="👨‍🏫" title="My Professors" />
        <LoadingState message="Loading professors..." />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="section">
        <SectionHeader icon="👨‍🏫" title="My Professors" />
        <ErrorState message={error} onRetry={loadProfessors} />
      </div>
    );
  }

  const enrollment = allEnrollments[currentSemesterIndex];
  if (!enrollment) {
    return (
      <div className="section">
        <SectionHeader icon="👨‍🏫" title="My Professors" />
        <EmptyState message="No data available" />
      </div>
    );
  }

  const courses = enrollment.enrolledCourseGradeDetails || enrollment.studentGradeHistoryData || [];

  return (
    <div className="section">
      <SectionHeader
        icon="👨‍🏫"
        title="My Professors"
        actions={
          <SemesterSelector
            enrollments={allEnrollments}
            selectedIndex={currentSemesterIndex}
            onChange={setCurrentSemesterIndex}
          />
        }
      />

      <div className="semester-info">
        <div className="semester-info-title">Semester Information</div>
        <div className="semester-info-text">
          School Year: {enrollment.academicYear || 'N/A'} | 
          Semester: {enrollment.term || 'N/A'} | 
          Year Level: {enrollment.yearLevel || 'N/A'}
        </div>
      </div>

      {/* Scroll hint for mobile */}
      <ScrollHint show={showHint} message="☜ Swipe to see all columns ☞" />

      <div
        className="table-container"
        onScroll={handleScrollHint}
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
