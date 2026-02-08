/**
 * SlowConnectionBanner
 * Displays a warning banner when the user's connection is slow or offline
 */

import '../../styles/SlowConnectionBanner.css';

function SlowConnectionBanner({ visible, isOffline }) {
  if (!visible && !isOffline) return null;

  const bannerClass = isOffline
    ? 'slow-connection-banner offline'
    : 'slow-connection-banner';

  return (
    <div className={bannerClass} role="status" aria-live="polite">
      <span className="slow-connection-icon">{isOffline ? '📡' : '⚠️'}</span>
      <span className="slow-connection-text">
        {isOffline
          ? 'You are offline. Please check your internet connection.'
          : 'Slow connection detected. Content may take longer to load.'}
      </span>
    </div>
  );
}

export default SlowConnectionBanner;
