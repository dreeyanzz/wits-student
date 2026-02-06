/**
 * Scroll Hint Component
 * Shows swipe hint on mobile devices for scrollable content
 */

import { isMobileDevice } from '../../utils/dom';
import '../../styles/ScrollHint.css';

function ScrollHint({ show, message = '☜ Swipe to see more ☞' }) {
  if (!isMobileDevice() || !show) {
    return null;
  }

  return (
    <div className="scroll-hint">
      {message}
    </div>
  );
}

export default ScrollHint;
