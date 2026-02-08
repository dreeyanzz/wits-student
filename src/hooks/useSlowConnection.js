/**
 * useSlowConnection Hook
 * Detects slow network conditions based on API request timing,
 * navigator.connection API (Chromium-only), and offline state
 */

import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../services/api';

const SLOW_THRESHOLD_MS = 5000;
const FAST_STREAK_TO_DISMISS = 3;

export function useSlowConnection() {
  const [isConnectionSlow, setIsConnectionSlow] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const fastStreakRef = useRef(0);

  // Track online/offline browser events
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Check navigator.connection for supplementary signal
  useEffect(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      const checkConnectionType = () => {
        const slowTypes = ['slow-2g', '2g'];
        if (slowTypes.includes(conn.effectiveType)) {
          setIsConnectionSlow(true);
          fastStreakRef.current = 0;
        }
      };
      checkConnectionType();
      conn.addEventListener('change', checkConnectionType);

      return () => conn.removeEventListener('change', checkConnectionType);
    }
  }, []);

  // Track API request timing
  useEffect(() => {
    const unsubscribe = ApiService.onRequestComplete(({ duration, success }) => {
      if (!success || duration >= SLOW_THRESHOLD_MS) {
        setIsConnectionSlow(true);
        fastStreakRef.current = 0;
      } else {
        fastStreakRef.current += 1;
        if (fastStreakRef.current >= FAST_STREAK_TO_DISMISS) {
          setIsConnectionSlow(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  return { isConnectionSlow, isOffline };
}
