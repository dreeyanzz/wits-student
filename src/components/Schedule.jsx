import { useState, useEffect, useRef, useCallback } from 'react';
import { ApiService } from '../services/api';
import { getItem } from '../services/storage';
import { TIME_SLOTS, DAYS } from '../config/constants';
import { getCourseColor, createLoadingHTML, createErrorHTML, isMobileDevice } from '../utils/dom';
import { getDayIndex, getMinutesFrom7AM } from '../utils/time';
import ScheduleModal from './ScheduleModal';
import ScheduleTooltip from './ScheduleTooltip';
import html2canvas from 'html2canvas';
import '../styles/Schedule.css';

/**
 * Schedule component - displays class schedule with filters
 */
function Schedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);
  const [courses, setCourses] = useState([]);
  const [yearName, setYearName] = useState('');
  const [termName, setTermName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Modal and tooltip state
  const [modalData, setModalData] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showScrollHint, setShowScrollHint] = useState(true);
  
  const loadCounterRef = useRef(0);
  const scrollContainerRef = useRef(null);

  /**
   * Clear all course blocks from the grid
   */
  const clearCourseBlocks = useCallback(() => {
    // Clear all blocks from time slot cells
    TIME_SLOTS.forEach((_, slotIndex) => {
      DAYS.forEach((_, dayIndex) => {
        const cell = document.getElementById(`slot-${dayIndex}-${slotIndex}`);
        if (cell) {
          while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
          }
        }
      });
    });
  }, []);

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    console.log('[Schedule] useEffect triggered:', { 
      enrollmentsLength: allEnrollments.length, 
      selectedScheduleIndex,
      schedule: allEnrollments[selectedScheduleIndex]
    });
    
    if (allEnrollments.length > 0 && selectedScheduleIndex >= 0) {
      const schedule = allEnrollments[selectedScheduleIndex];
      console.log('[Schedule] Loading schedule for:', schedule);
      
      // Clear existing blocks before loading new schedule
      clearCourseBlocks();
      
      loadScheduleData(schedule.yearId, schedule.termId, schedule.yearName, schedule.termName);
    }
  }, [selectedScheduleIndex, allEnrollments, clearCourseBlocks]);

  // Clear blocks when component unmounts
  useEffect(() => {
    return () => {
      clearCourseBlocks();
    };
  }, [clearCourseBlocks]);

  /**
   * Fetches all available year-term combinations from the API
   */
  const loadSchedules = async () => {
    const myLoadId = ++loadCounterRef.current;
    setLoading(true);
    setError(null);

    try {
      const userData = getItem('userData');
      const years = getItem('academicYears') || [];
      
      console.log('[Schedule] Loading schedules...', { userData, years });

      if (!userData || !userData.studentId) {
        throw new Error('User data not available');
      }

      if (years.length === 0) {
        throw new Error('No academic years available');
      }

      const allSchedules = [];

      // For each year, get its available terms
      for (const year of years) {
        try {
          console.log(`[Schedule] Fetching terms for year ${year.name}...`);
          const termsResult = await ApiService.get(`/api/student/${userData.studentId}/${year.id}/terms`);
          
          console.log(`[Schedule] Terms result for ${year.name}:`, termsResult);
          
          if (termsResult.status === 200 && termsResult.data?.items) {
            // Add each term as a schedule option
            termsResult.data.items.forEach(term => {
              allSchedules.push({
                yearId: year.id,
                yearName: year.name,
                termId: term.id,
                termName: term.name,
                yearLevel: '',  // Will be filled in enrichWithYearLevels()
                displayText: `${year.name}: ${term.name}`
              });
            });
          }
        } catch (error) {
          console.error(`[Schedule] Error fetching terms for year ${year.name}:`, error);
        }
      }

      console.log('[Schedule] All schedules collected:', allSchedules);

      // Reverse to show most recent first
      const reversedSchedules = allSchedules.reverse();

      if (myLoadId !== loadCounterRef.current) return;

      // Enrich with year levels
      await enrichWithYearLevels(reversedSchedules, myLoadId);

      if (myLoadId !== loadCounterRef.current) return;

      console.log('[Schedule] Final schedules:', reversedSchedules);

      setAllEnrollments(reversedSchedules);

      if (reversedSchedules.length > 0) {
        setSelectedScheduleIndex(0);
      } else {
        setError('No schedules available');
        setLoading(false);
      }
    } catch (error) {
      console.error('[Schedule] Error in loadSchedules:', error);
      if (myLoadId === loadCounterRef.current) {
        setError(error.message || 'Failed to load schedules');
        setLoading(false);
      }
    }
  };

  /**
   * Enriches schedule data with year levels from gradesData
   */
  const enrichWithYearLevels = async (schedules, myLoadId) => {
    let gradesData = getItem('gradesData');

    // Fetch gradesData if not already loaded
    if (!gradesData) {
      const studentInfo = getItem('studentInfo');
      if (studentInfo?.idDepartment) {
        try {
          const userData = getItem('userData');
          const departmentId = studentInfo.idDepartment;
          const endpoint = `/api/studentgradefile/student/${userData.studentId}/department/${departmentId}`;
          const result = await ApiService.get(endpoint);

          if (result.status === 200 && result.data?.items) {
            gradesData = result.data.items;
          }
        } catch (error) {
          console.error('Error fetching gradesData:', error);
          return;
        }
      }
    }

    if (!gradesData?.studentEnrollments) return;

    // Match schedules with enrollments to get year levels
    schedules.forEach(schedule => {
      const enrollment = gradesData.studentEnrollments.find(
        e => e.academicYear === schedule.yearName && e.term === schedule.termName
      );

      if (enrollment?.yearLevel) {
        schedule.yearLevel = enrollment.yearLevel;
        schedule.displayText = `${schedule.yearName}: ${schedule.termName} (${enrollment.yearLevel})`;
      }
    });
  };

  /**
   * Loads schedule data for selected year and term
   */
  const loadScheduleData = async (yearId, termId, year, term) => {
    const myLoadId = ++loadCounterRef.current;
    setLoading(true);
    setError(null);

    try {
      const userData = getItem('userData');
      const endpoint = `/api/student/${userData.studentId}/${yearId}/${termId}/schedule`;
      
      console.log('[Schedule] Loading schedule data:', { yearId, termId, year, term, endpoint });
      
      const result = await ApiService.get(endpoint);

      console.log('[Schedule] Schedule data result:', result);

      if (myLoadId !== loadCounterRef.current) return;

      if (result.status === 200 && result.data?.items) {
        console.log('[Schedule] Schedule loaded successfully:', result.data.items);
        setCourses(result.data.items);
        setYearName(year);
        setTermName(term);
        setLoading(false);
      } else {
        console.error('[Schedule] Invalid schedule data:', result);
        setError('Failed to load schedule');
        setLoading(false);
      }
    } catch (error) {
      console.error('[Schedule] Error in loadScheduleData:', error);
      if (myLoadId === loadCounterRef.current) {
        setError(error.message || 'Failed to load schedule');
        setLoading(false);
      }
    }
  };

  /**
   * Handles semester selection change
   */
  const handleSemesterChange = (e) => {
    const index = parseInt(e.target.value, 10);
    setSelectedScheduleIndex(index);
  };

  /**
   * Downloads schedule as PNG image
   */
  const downloadScheduleAsImage = async () => {
    setIsDownloading(true);

    try {
      const scheduleContainer = document.querySelector('.schedule-grid-container');
      if (!scheduleContainer) {
        throw new Error('Schedule grid not found');
      }

      // Store original styles
      const originalOverflow = scheduleContainer.style.overflow;
      const originalMinWidth = scheduleContainer.style.minWidth;
      const originalWidth = scheduleContainer.style.width;
      
      // Force consistent rendering for screenshot
      scheduleContainer.style.overflow = 'visible';
      scheduleContainer.style.minWidth = '1200px';
      scheduleContainer.style.width = 'fit-content';

      // Small delay to ensure styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Calculate exact dimensions for consistent rendering
      const scheduleGrid = scheduleContainer.querySelector('.schedule-grid');
      const computedWidth = scheduleGrid ? scheduleGrid.scrollWidth : scheduleContainer.scrollWidth;
      const computedHeight = scheduleContainer.scrollHeight;

      // Use html2canvas with fixed dimensions
      const canvas = await html2canvas(scheduleContainer, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        width: Math.max(computedWidth, 1200),
        height: computedHeight,
        windowWidth: Math.max(computedWidth, 1200),
        windowHeight: computedHeight,
        onclone: (clonedDoc) => {
          const clonedContainer = clonedDoc.querySelector('.schedule-grid-container');
          if (clonedContainer) {
            clonedContainer.style.overflow = 'visible';
            clonedContainer.style.minWidth = '1200px';
            clonedContainer.style.width = 'fit-content';
          }
        }
      });

      // Restore original styles
      scheduleContainer.style.overflow = originalOverflow;
      scheduleContainer.style.minWidth = originalMinWidth;
      scheduleContainer.style.width = originalWidth;

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to generate image');
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Generate filename
        const sanitizedYear = yearName.replace(/[^a-z0-9]/gi, '_');
        const sanitizedTerm = termName.replace(/[^a-z0-9]/gi, '_');
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `Schedule_${sanitizedYear}_${sanitizedTerm}_${timestamp}.png`;
        
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        setIsDownloading(false);
      }, 'image/png');

    } catch (error) {
      console.error('Error downloading schedule:', error);
      
      // Make sure to restore styles even on error
      const scheduleContainer = document.querySelector('.schedule-grid-container');
      if (scheduleContainer) {
        scheduleContainer.style.overflow = '';
        scheduleContainer.style.minWidth = '';
        scheduleContainer.style.width = '';
      }
      
      setIsDownloading(false);
      alert('Failed to download schedule. Please try again.');
    }
  };

  /**
   * Renders the schedule grid
   */
  const renderScheduleGrid = () => {
    return (
      <>
        <div className="schedule-grid-container">
          <div className="schedule-grid" id="scheduleGrid">
            {/* Headers */}
            <div className="time-header">Time</div>
            {DAYS.map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}

            {/* Empty first row */}
            <div style={{ gridColumn: 1, background: 'linear-gradient(to right, #fafbfc 0%, #f8f9fb 100%)', borderRight: '2px solid #d5dce3', minHeight: '40px' }}></div>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderTop: '1px solid #e8eef3', borderLeft: '1px solid #e8eef3', minHeight: '40px' }}></div>
            ))}

            {/* Time column */}
            <div className="time-column" style={{ gridRow: `3 / span ${TIME_SLOTS.length}`, height: `${TIME_SLOTS.length * 40}px` }}>
              {TIME_SLOTS.map((time, index) => (
                <div key={time} className="time-label" style={{ top: `${index * 40}px` }}>{time}</div>
              ))}
            </div>

            {/* Time slots */}
            {TIME_SLOTS.map((time, slotIndex) => (
              DAYS.map((_, dayIndex) => (
                <div 
                  key={`slot-${dayIndex}-${slotIndex}`}
                  className="time-slot" 
                  data-day={dayIndex} 
                  data-slot={slotIndex}
                  id={`slot-${dayIndex}-${slotIndex}`}
                ></div>
              ))
            ))}
          </div>
        </div>
        
        {/* Course blocks - rendered separately and will be appended to cells */}
        {renderCourseBlocks()}
      </>
    );
  };

  /**
   * Renders course blocks on the schedule grid
   */
  const renderCourseBlocks = () => {
    const blocks = [];

    courses.forEach((course, courseIdx) => {
      if (!course.schedule) return;

      course.schedule.forEach((sched, schedIdx) => {
        if (!sched.day) return;

        sched.day.forEach((dayObj, dayObjIdx) => {
          const dayIndex = getDayIndex(dayObj.code);
          if (dayIndex === undefined) return;

          const startMinutes = getMinutesFrom7AM(sched.timeFrom);
          const endMinutes = getMinutesFrom7AM(sched.timeTo);
          const slotIndex = Math.floor((startMinutes - 30) / 30);

          if (slotIndex < 0) return;

          const durationMinutes = endMinutes - startMinutes;
          const heightPx = (durationMinutes / 30) * 40 - 6;
          const offsetPx = ((startMinutes - 30) % 30) * (40 / 30);
          const color = getCourseColor(course.courseCode);

          const blockKey = `block-${yearName}-${termName}-${courseIdx}-${schedIdx}-${dayObjIdx}`;

          blocks.push(
            <CourseBlock
              key={blockKey}
              course={course}
              schedule={sched}
              dayIndex={dayIndex}
              slotIndex={slotIndex}
              heightPx={heightPx}
              offsetPx={offsetPx}
              color={color}
              onModalOpen={setModalData}
              onTooltipShow={(e) => {
                setTooltipData({ course, schedule: sched, color });
                setTooltipPosition({ x: e.clientX, y: e.clientY });
              }}
              onTooltipHide={() => setTooltipData(null)}
            />
          );
        });
      });
    });

    return blocks;
  };

  // Render loading state
  if (loading) {
    return (
      <section className="section">
        <h2 className="section-title">📅 My Class Schedule</h2>
        <div dangerouslySetInnerHTML={{ __html: createLoadingHTML('Loading schedule...') }} />
      </section>
    );
  }

  // Render error state
  if (error) {
    return (
      <section className="section">
        <h2 className="section-title">📅 My Class Schedule</h2>
        <div dangerouslySetInnerHTML={{ __html: createErrorHTML(error) }} />
      </section>
    );
  }

  return (
    <section className="section">
      <div className="schedule-header">
        <h2 className="section-title no-margin">📅 My Class Schedule</h2>
        <div className="semester-selector">
          <label htmlFor="scheduleSemesterSelect">Semester:</label>
          <select 
            id="scheduleSemesterSelect" 
            value={selectedScheduleIndex}
            onChange={handleSemesterChange}
          >
            {allEnrollments.map((schedule, index) => (
              <option key={index} value={index}>
                {schedule.displayText}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="semester-info">
        <div className="semester-info-title">Viewing Schedule</div>
        <div className="semester-info-text">
          Academic Year: {yearName} | Semester: {termName}
        </div>
        <button 
          className="btn-success" 
          onClick={downloadScheduleAsImage}
          disabled={isDownloading}
          style={{ marginTop: '10px' }}
        >
          {isDownloading ? '📸 Generating...' : '📸 Download Schedule'}
        </button>
      </div>

      <div key={`schedule-${yearName}-${termName}`}>
        {/* Scroll hint for mobile */}
        {isMobileDevice() && showScrollHint && (
          <div className="schedule-scroll-hint">
            ☜ Swipe to see more days ☞
          </div>
        )}
        <div 
          ref={scrollContainerRef}
          onScroll={() => setShowScrollHint(false)}
          style={{ width: '100%' }}
        >
          {renderScheduleGrid()}
        </div>
      </div>

      {/* Modal */}
      {modalData && (
        <ScheduleModal
          course={modalData.course}
          schedule={modalData.schedule}
          onClose={() => setModalData(null)}
        />
      )}

      {/* Tooltip */}
      {tooltipData && !isMobileDevice() && (
        <ScheduleTooltip
          course={tooltipData.course}
          schedule={tooltipData.schedule}
          color={tooltipData.color}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        />
      )}
    </section>
  );
}

/**
 * Course Block Component - Uses direct DOM manipulation after mount
 */
function CourseBlock({ course, schedule, dayIndex, slotIndex, heightPx, offsetPx, color, onModalOpen, onTooltipShow, onTooltipHide }) {
  const blockRef = useRef(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Append block to the correct cell after render
    const block = blockRef.current;
    if (!block || isMountedRef.current) return;

    const cell = document.getElementById(`slot-${dayIndex}-${slotIndex}`);
    if (cell && block.parentElement) {
      // Move from React root to grid cell
      block.parentElement.removeChild(block);
      cell.appendChild(block);
      isMountedRef.current = true;
    }
  }, [dayIndex, slotIndex]);

  const handleClick = (e) => {
    if (isMobileDevice()) {
      e.stopPropagation();
      onModalOpen({ course, schedule });
    }
  };

  const handleMouseMove = (e) => {
    if (!isMobileDevice()) {
      onTooltipShow(e);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobileDevice()) {
      onTooltipHide();
    }
  };

  return (
    <div
      ref={blockRef}
      className="class-block"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background: color,
        top: `${offsetPx}px`,
        height: `${heightPx}px`,
        position: 'absolute',
        left: '3px',
        right: '3px',
        zIndex: 10
      }}
    >
      <div className="class-code">{course.courseCode}</div>
      <div className="class-section">{course.section || 'N/A'}</div>
      <div className="class-name">{course.description}</div>
      <div className="class-room">📍 {schedule.roomName}</div>
    </div>
  );
}

export default Schedule;
