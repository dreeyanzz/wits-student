/**
 * Schedule Tooltip Component
 * Displays course details in a tooltip on hover (desktop only)
 */
function ScheduleTooltip({ course, schedule, color, x, y }) {
  return (
    <div 
      id="schedule-tooltip" 
      className="custom-tooltip"
      style={{
        display: 'block',
        left: `${x + 15}px`,
        top: `${y + 15}px`,
        background: 'white',
        borderLeftColor: color,
        position: 'fixed',
        zIndex: 9999
      }}
    >
      <div className="tooltip-header">
        {course.courseCode} - {course.section || 'N/A'}
      </div>
      <div style={{ marginBottom: '8px', color: '#2c3e50' }}>
        {course.description}
      </div>
      <div className="tooltip-row">
        <span className="tooltip-icon">👨‍🏫</span>
        <span>{course.instructor}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-icon">⏰</span>
        <span>{schedule.timeFrom} - {schedule.timeTo}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-icon">📍</span>
        <span>{schedule.roomName}</span>
      </div>
    </div>
  );
}

export default ScheduleTooltip;
