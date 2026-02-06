/**
 * Custom Hook: useScrollHint
 * Manages scroll hint visibility for mobile tables
 */

import { useState } from 'react';

export function useScrollHint() {
  const [showHint, setShowHint] = useState(true);

  const handleScroll = () => {
    if (showHint) {
      setShowHint(false);
    }
  };

  const resetHint = () => {
    setShowHint(true);
  };

  return {
    showHint,
    handleScroll,
    resetHint,
  };
}
