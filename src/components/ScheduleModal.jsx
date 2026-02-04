import { useEffect } from 'react';
import { getDayName } from '../utils/time';

/**
 * Schedule Modal Component
 * Displays course details in a modal (primarily for mobile)
 */
function ScheduleModal({ course, schedule, onClose }) {
  useEffect(() => {
    // Disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const dayNames = schedule.day
    .map(d => getDayName(d.code))
    .join(', ');

  return (
    <div className="schedule-modal show" onClick={handleBackdropClick}>
      <div className="schedule-modal-content">
        <button className="schedule-modal-close" onClick={onClose}>×</button>
        <div className="schedule-modal-header">
          {course.courseCode} - {course.section || 'N/A'}
        </div>
        <div className="schedule-modal-subtitle">
          {course.description}
        </div>
        <div>
          <div className="schedule-modal-row">
            <span className="schedule-modal-icon">👨‍🏫</span>
            <span className="schedule-modal-text">{course.instructor}</span>
          </div>
          <div className="schedule-modal-row">
            <span className="schedule-modal-icon">📅</span>
            <span className="schedule-modal-text">{dayNames}</span>
          </div>
          <div className="schedule-modal-row">
            <span className="schedule-modal-icon">⏰</span>
            <span className="schedule-modal-text">
              {schedule.timeFrom} - {schedule.timeTo}
            </span>
          </div>
          <div className="schedule-modal-row">
            <span className="schedule-modal-icon">📍</span>
            <span className="schedule-modal-text">{schedule.roomName}</span>
          </div>
          <div className="schedule-modal-row">
            <span className="schedule-modal-icon">📚</span>
            <span className="schedule-modal-text">
              {schedule.type === 'LAB' || schedule.isLab ? 'Laboratory' : 'Lecture'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleModal;
