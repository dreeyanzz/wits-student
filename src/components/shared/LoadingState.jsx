/**
 * Loading State Component
 * Replaces createLoadingHTML utility
 */

import '../../styles/LoadingState.css';

function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <div className="loading-text">{message}</div>
    </div>
  );
}

export default LoadingState;
