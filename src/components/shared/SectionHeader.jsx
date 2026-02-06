/**
 * Section Header Component
 * Standardized header for all main sections
 */

import '../../styles/SectionHeader.css';

function SectionHeader({ icon, title, actions, children }) {
  return (
    <div className="section-header">
      <h2 className="section-title no-margin">
        {icon && <span className="section-icon">{icon}</span>}
        {title}
      </h2>
      {actions && (
        <div className="section-actions">
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export default SectionHeader;
