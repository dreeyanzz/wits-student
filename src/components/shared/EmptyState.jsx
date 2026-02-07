/**
 * Empty State Component
 * Displays a message when no data is available
 */

import '../../styles/EmptyState.css';

function EmptyState({ message = 'No data available', icon = '📭' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-message">{message}</div>
    </div>
  );
}

export default EmptyState;
