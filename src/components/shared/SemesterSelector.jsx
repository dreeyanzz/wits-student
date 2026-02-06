/**
 * Semester Selector Component
 * Reusable dropdown for selecting academic semesters
 */

import '../../styles/SemesterSelector.css';

function SemesterSelector({ enrollments, selectedIndex, onChange, label = 'Semester:' }) {
  if (!enrollments || enrollments.length === 0) {
    return null;
  }

  return (
    <div className="semester-selector">
      <label htmlFor="semesterSelect">{label}</label>
      <select 
        id="semesterSelect"
        value={selectedIndex}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      >
        {enrollments.map((enrollment, index) => {
          const schoolYear = enrollment.academicYear || enrollment.yearName || 'N/A';
          const semester = enrollment.term || enrollment.termName || 'N/A';
          const yearLevel = enrollment.yearLevel || '';
          
          // Support both displayText (Schedule) and constructed text (Grades/Professors)
          const displayText = enrollment.displayText || 
            `${schoolYear}: ${semester}${yearLevel ? ` (${yearLevel})` : ''}`;

          return (
            <option key={index} value={index}>
              {displayText}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default SemesterSelector;
