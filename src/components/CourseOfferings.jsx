import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../services/api';
import { getItem } from '../services/storage';
import { createLoadingHTML, createErrorHTML, isMobileDevice } from '../utils/dom';
import { CONFIG } from '../config/constants';
import '../styles/CourseOfferings.css';

/**
 * Course Offerings component - search and view course offerings
 */
function CourseOfferings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [offerings, setOfferings] = useState([]);
  const [searchingOfferings, setSearchingOfferings] = useState(false);
  const [offeringsError, setOfferingsError] = useState(null);
  const [sortBy, setSortBy] = useState('section');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showScrollHint, setShowScrollHint] = useState(true);
  
  const loadCounterRef = useRef(0);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  /**
   * Load all courses on mount
   */
  useEffect(() => {
    loadCourses();
  }, []);

  /**
   * Handle clicks outside dropdown
   */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchRef.current &&
        dropdownRef.current &&
        !searchRef.current.contains(e.target) &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  /**
   * Filter courses when search term changes
   */
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses(allCourses);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = allCourses.filter(course =>
        course.courseCode.toLowerCase().includes(term) ||
        course.courseName.toLowerCase().includes(term)
      );
      setFilteredCourses(filtered);
    }
    setSelectedIndex(-1);
  }, [searchTerm, allCourses]);

  /**
   * Loads all available courses
   */
  const loadCourses = async () => {
    const myLoadId = ++loadCounterRef.current;
    setLoading(true);
    setError(null);

    try {
      const currentAcademicYearId = getItem('currentAcademicYearId');
      const currentTermId = getItem('currentTermId');

      if (!currentAcademicYearId || !currentTermId) {
        throw new Error('Cannot load courses - academic data not available');
      }

      const endpoint = '/api/program/acadyear/term/coursecode';
      const payload = {
        idAcademicYear: currentAcademicYearId,
        idTerm: currentTermId,
      };

      const result = await ApiService.post(endpoint, payload, CONFIG.LOGIN_URL);

      if (myLoadId !== loadCounterRef.current) return;

      if (result.status === 200 && result.data?.items) {
        setAllCourses(result.data.items);
        setFilteredCourses(result.data.items);
        setLoading(false);
      } else {
        setError('Failed to load course list');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      if (myLoadId === loadCounterRef.current) {
        setError(err.message || 'Failed to load courses');
        setLoading(false);
      }
    }
  };

  /**
   * Handles search input change
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  /**
   * Handles search input focus
   */
  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  /**
   * Handles keyboard navigation
   */
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCourses.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredCourses[selectedIndex]) {
        handleCourseSelect(filteredCourses[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  /**
   * Handles course selection
   */
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSearchTerm(`${course.courseCode} - ${course.courseName}`);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  /**
   * Searches for course offerings
   */
  const searchOfferings = async () => {
    if (!selectedCourse) {
      setOfferingsError('Please select a course from the search box first');
      return;
    }

    const mySearchId = ++loadCounterRef.current;
    setSearchingOfferings(true);
    setOfferingsError(null);
    setOfferings([]);

    try {
      const currentAcademicYearId = getItem('currentAcademicYearId');
      const currentTermId = getItem('currentTermId');
      const studentInfo = getItem('studentInfo');

      if (!currentAcademicYearId || !currentTermId) {
        throw new Error('Cannot search offerings - academic data not available');
      }

      if (!studentInfo?.idBranch) {
        throw new Error('Cannot search offerings - branch information not available');
      }

      const endpoint = '/api/courseoffering/search';
      const payload = {
        idBranch: studentInfo.idBranch,
        idProgram: null,
        idYearLevel: null,
        idAcademicYear: currentAcademicYearId,
        idTerm: currentTermId,
        idSectionBlock: null,
        idCourse: selectedCourse.idCourse,
        courseTitle: '',
      };

      const result = await ApiService.post(endpoint, payload, CONFIG.BASE_URL);

      if (mySearchId !== loadCounterRef.current) return;

      if (result.status === 200 && result.data?.items) {
        const offeringsList = result.data.items.courseOfferings || [];
        setOfferings(offeringsList);
        setSortBy('section');
        setSearchingOfferings(false);
      } else {
        setOfferingsError('No offerings found for this course');
        setSearchingOfferings(false);
      }
    } catch (err) {
      console.error('Error searching offerings:', err);
      if (mySearchId === loadCounterRef.current) {
        setOfferingsError(err.message || 'Failed to search offerings');
        setSearchingOfferings(false);
      }
    }
  };

  /**
   * Gets sorted offerings
   */
  const getSortedOfferings = () => {
    if (!offerings || offerings.length === 0) return [];

    const sorted = [...offerings];

    switch (sortBy) {
      case 'section':
        sorted.sort((a, b) => {
          const sectionA = a.courseSection || '';
          const sectionB = b.courseSection || '';
          return sectionA.localeCompare(sectionB);
        });
        break;

      case 'slots':
        sorted.sort((a, b) => {
          const occupiedA = (a.assessed || 0) + (a.enrolled || 0);
          const availableA = (a.maxStudents || 0) - occupiedA;
          const occupiedB = (b.assessed || 0) + (b.enrolled || 0);
          const availableB = (b.maxStudents || 0) - occupiedB;
          return availableB - availableA;
        });
        break;

      case 'status':
        sorted.sort((a, b) => {
          const getStatusPriority = (offering) => {
            const totalOccupied = (offering.assessed || 0) + (offering.enrolled || 0);
            const maxStudents = offering.maxStudents || 0;
            
            if (offering.isClosed === 'Y' || offering.reserved === 'Y') {
              return 3;
            } else if (totalOccupied >= maxStudents) {
              return 2;
            } else {
              return 1;
            }
          };
          return getStatusPriority(a) - getStatusPriority(b);
        });
        break;

      case 'faculty':
        sorted.sort((a, b) => {
          const facultyA = a.faculty || 'ZZZ';
          const facultyB = b.faculty || 'ZZZ';
          return facultyA.localeCompare(facultyB);
        });
        break;

      default:
        break;
    }

    return sorted;
  };

  /**
   * Gets sort icon for column
   */
  const getSortIcon = (column) => {
    if (sortBy === column) {
      return <span className="sort-icon">▼</span>;
    }
    return <span className="sort-icon sort-icon-inactive">⇅</span>;
  };

  /**
   * Gets status info for offering
   */
  const getStatus = (offering) => {
    const totalOccupied = (offering.assessed || 0) + (offering.enrolled || 0);
    const maxStudents = offering.maxStudents || 0;

    if (offering.isClosed === 'Y' || offering.reserved === 'Y') {
      return { class: 'status-closed', text: 'Closed' };
    } else if (totalOccupied >= maxStudents) {
      return { class: 'status-full', text: 'Full' };
    } else {
      return { class: 'status-open', text: 'Open' };
    }
  };

  // Render loading state
  if (loading) {
    return (
      <section className="section">
        <h2 className="section-title">🔍 Course Offerings</h2>
        <div dangerouslySetInnerHTML={{ __html: createLoadingHTML('Loading courses...') }} />
      </section>
    );
  }

  // Render error state
  if (error) {
    return (
      <section className="section">
        <h2 className="section-title">🔍 Course Offerings</h2>
        <div dangerouslySetInnerHTML={{ __html: createErrorHTML(error) }} />
      </section>
    );
  }

  const sortedOfferings = getSortedOfferings();

  return (
    <section className="section">
      <h2 className="section-title">🔍 Course Offerings</h2>

      {/* Search Form */}
      <div className="course-search-form">
        <div className="form-group">
          <label htmlFor="courseSearchInput">Search Course:</label>
          <div className="search-dropdown-wrapper">
            <input
              ref={searchRef}
              type="text"
              id="courseSearchInput"
              className="course-search-input"
              placeholder="Type to search courses..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleKeyDown}
            />
            {showDropdown && filteredCourses.length > 0 && (
              <div ref={dropdownRef} className="course-dropdown-list show">
                {filteredCourses.map((course, index) => (
                  <div
                    key={course.idCourse}
                    className={`course-dropdown-item ${selectedCourse?.idCourse === course.idCourse ? 'selected' : ''} ${index === selectedIndex ? 'active' : ''}`}
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className="course-code-text">{course.courseCode}</div>
                    <div className="course-name-text">{course.courseName}</div>
                  </div>
                ))}
              </div>
            )}
            {showDropdown && searchTerm && filteredCourses.length === 0 && (
              <div ref={dropdownRef} className="course-dropdown-list show">
                <div className="course-dropdown-empty">No courses found</div>
              </div>
            )}
          </div>
        </div>

        <button 
          className="btn-success"
          onClick={searchOfferings}
          disabled={!selectedCourse || searchingOfferings}
        >
          {searchingOfferings ? '🔍 Searching...' : '🔍 Search Offerings'}
        </button>
      </div>

      {/* Offerings Display */}
      {searchingOfferings && (
        <div dangerouslySetInnerHTML={{ __html: createLoadingHTML('Loading course offerings...') }} />
      )}

      {offeringsError && (
        <div dangerouslySetInnerHTML={{ __html: createErrorHTML(offeringsError) }} />
      )}

      {!searchingOfferings && !offeringsError && offerings.length > 0 && (
        <>
          <div className="semester-info">
            <div className="semester-info-title">Course Information</div>
            <div className="semester-info-text">
              Course Code: {selectedCourse?.courseCode} | 
              Course Name: {selectedCourse?.courseName}
            </div>
          </div>

          {/* Scroll hint for mobile */}
          {isMobileDevice() && showScrollHint && (
            <div className="offerings-scroll-hint">
              ☜ Swipe to see all columns ☞
            </div>
          )}

          <div 
            className="table-container"
            onScroll={() => setShowScrollHint(false)}
          >
            <table className="offerings-table">
              <thead>
                <tr>
                  <th 
                    className="sortable" 
                    onClick={() => setSortBy('section')}
                    style={{ width: '100px' }}
                  >
                    Section {getSortIcon('section')}
                  </th>
                  <th style={{ width: '150px' }}>Schedule</th>
                  <th 
                    className="sortable center" 
                    onClick={() => setSortBy('slots')}
                    style={{ width: '100px' }}
                  >
                    Slots {getSortIcon('slots')}
                  </th>
                  <th 
                    className="sortable" 
                    onClick={() => setSortBy('faculty')}
                    style={{ width: '200px' }}
                  >
                    Faculty {getSortIcon('faculty')}
                  </th>
                  <th className="center" style={{ width: '90px' }}>Mode</th>
                  <th 
                    className="sortable center" 
                    onClick={() => setSortBy('status')}
                    style={{ width: '80px' }}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th style={{ width: '150px' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {sortedOfferings.map((offering, index) => {
                  const totalOccupied = (offering.assessed || 0) + (offering.enrolled || 0);
                  const maxStudents = offering.maxStudents || 0;
                  const percentage = maxStudents > 0 ? (totalOccupied / maxStudents) * 100 : 0;
                  const status = getStatus(offering);
                  const faculty = offering.faculty || 'No instructor assigned';
                  const coFaculty = offering.coFaculty ? ` (Co: ${offering.coFaculty})` : '';
                  const modeOfDelivery = offering.modeOfDelivery || 'N/A';
                  const remarks = offering.remarks ? offering.remarks.trim() : '-';

                  return (
                    <tr key={index}>
                      <td>
                        <span className="section-label">{offering.courseSection || '-'}</span>
                      </td>
                      <td>
                        {offering.schedule && offering.schedule.length > 0 ? (
                          offering.schedule.map((sched, schedIdx) => {
                            const day = sched.day?.trim() || 'TBA';
                            const time = sched.time?.trim() || 'TBA';
                            const room = sched.roomNo?.trim() || 'TBA';
                            const labIndicator = sched.lab ? ' (Lab)' : '';

                            return (
                              <div key={schedIdx} className="schedule-item">
                                <div className="schedule-day">{day}{labIndicator}</div>
                                <div className="schedule-time">⏰ {time}</div>
                                <div className="schedule-room">📍 {room}</div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="schedule-item">
                            <div className="schedule-day">No schedule available</div>
                          </div>
                        )}
                      </td>
                      <td className="center">
                        <div className="slots-display">
                          <div className="slots-bar">
                            <div className="slots-fill" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <div className="slots-text">{totalOccupied} / {maxStudents}</div>
                        </div>
                      </td>
                      <td>{faculty}{coFaculty}</td>
                      <td className="center">{modeOfDelivery}</td>
                      <td className="center">
                        <span className={`status-badge ${status.class}`}>{status.text}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.9em', color: '#666' }}>{remarks}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!searchingOfferings && !offeringsError && offerings.length === 0 && selectedCourse && (
        <div className="loading">No offerings available for this course</div>
      )}
    </section>
  );
}

export default CourseOfferings;
