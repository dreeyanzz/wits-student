import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../services/api';
import { getItem } from '../services/storage';
import { createLoadingHTML, createErrorHTML, isMobileDevice } from '../utils/dom';
import '../styles/Grades.css';

/**
 * Grades component - displays academic grades
 */
function Grades() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [currentSemesterIndex, setCurrentSemesterIndex] = useState(0);
  const [showScrollHint, setShowScrollHint] = useState(true);
  
  const loadCounterRef = useRef(0);

  /**
   * Initial load of grades data
   */
  useEffect(() => {
    loadGrades();
  }, []);

  /**
   * Fetches grades data from API
   */
  const loadGrades = async () => {
    const myLoadId = ++loadCounterRef.current;
    setLoading(true);
    setError(null);

    try {
      const studentInfo = getItem('studentInfo');
      if (!studentInfo?.idDepartment) {
        throw new Error('Cannot load grades - department information not available');
      }

      const userData = getItem('userData');
      const departmentId = studentInfo.idDepartment;
      const endpoint = `/api/studentgradefile/student/${userData.studentId}/department/${departmentId}`;
      const result = await ApiService.get(endpoint);

      if (myLoadId !== loadCounterRef.current) return;

      if (result.status === 200 && result.data?.items) {
        const enrollments = result.data.items.studentEnrollments || [];
        setAllEnrollments(enrollments);

        if (enrollments.length > 0) {
          setCurrentSemesterIndex(0);
        } else {
          setError('No grades available');
        }
        
        setLoading(false);
      } else {
        setError('Failed to load grades');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading grades:', err);
      if (myLoadId === loadCounterRef.current) {
        setError(err.message || 'Failed to load grades');
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

  /**
   * Gets grade color class based on numeric value
   */
  const getGradeClass = (grade) => {
    if (grade === '-' || grade === '') return '';
    const numGrade = parseFloat(grade);
    return numGrade >= 4.5 ? 'grade-excellent' :
           numGrade >= 4.0 ? 'grade-good' :
           numGrade >= 3.0 ? 'grade-average' :
           numGrade >= 2.0 ? 'grade-poor' : 'grade-failing';
  };

  // Render loading state
  if (loading) {
    return (
      <section className="section">
        <h2 className="section-title">📊 Academic Grades</h2>
        <div dangerouslySetInnerHTML={{ __html: createLoadingHTML('Loading grades...') }} />
      </section>
    );
  }

  // Render error state
  if (error) {
    return (
      <section className="section">
        <h2 className="section-title">📊 Academic Grades</h2>
        <div dangerouslySetInnerHTML={{ __html: createErrorHTML(error) }} />
      </section>
    );
  }

  const enrollment = allEnrollments[currentSemesterIndex];
  if (!enrollment) {
    return (
      <section className="section">
        <h2 className="section-title">📊 Academic Grades</h2>
        <div className="loading">No grades available</div>
      </section>
    );
  }

  const courses = enrollment.enrolledCourseGradeDetails || enrollment.studentGradeHistoryData || [];

  return (
    <section className="section">
      <div className="grades-header">
        <h2 className="section-title no-margin">📊 Academic Grades</h2>
        <div className="semester-selector">
          <label htmlFor="semesterSelect">Semester:</label>
          <select 
            id="semesterSelect"
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
          Year Level: {enrollment.yearLevel || 'N/A'} | 
          Status: {enrollment.idEnrollmentStatus === 2 ? 'Enrolled' : 'N/A'}
          {enrollment.gwa && enrollment.gwa > 0 && ` | GWA: ${enrollment.gwa.toFixed(2)}`}
        </div>
      </div>

      {/* Scroll hint for mobile */}
      {isMobileDevice() && showScrollHint && (
        <div className="grades-scroll-hint">
          ☜ Swipe to see all columns ☞
        </div>
      )}

      <div 
        className="table-container"
        onScroll={() => setShowScrollHint(false)}
      >
        <table className="grades-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Course Code</th>
              <th>Course Title</th>
              <th className="center" style={{ width: '60px' }}>Units</th>
              <th className="center" style={{ width: '80px' }}>Midterm</th>
              <th className="center" style={{ width: '80px' }}>Final</th>
              <th className="center" style={{ width: '100px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => {
              let midtermGrade = '-';
              let finalGrade = '-';

              if (course.gradeDetails && course.gradeDetails.length > 0) {
                const midterm = course.gradeDetails.find(g => g.periodName === 'Midterm');
                const final = course.gradeDetails.find(g => g.periodName === 'Final');

                midtermGrade = midterm?.grade || '-';
                finalGrade = final?.grade || course.gradeDetailFinal?.grade || '-';
              } else {
                finalGrade = course.gradeDetailFinal?.grade || '-';
              }

              const gradeStatus = course.gradeDetailFinal?.gradeStatus || course.remarks || '-';
              const midtermClass = getGradeClass(midtermGrade);
              const finalClass = getGradeClass(finalGrade);
              const professor = course.professor || 'No instructor assigned';

              return (
                <tr key={index}>
                  <td>
                    <span className="course-code">{course.courseCode || '-'}</span>
                  </td>
                  <td>
                    <div className="course-info">
                      <div className="course-title">{course.courseTitle || '-'}</div>
                      <div className="course-professor">{professor}</div>
                    </div>
                  </td>
                  <td className="center">{course.units || 0}</td>
                  <td className={`grade-cell ${midtermClass}`}>{midtermGrade}</td>
                  <td className={`grade-cell ${finalClass}`}>{finalGrade}</td>
                  <td className="center">{gradeStatus}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Grades;
