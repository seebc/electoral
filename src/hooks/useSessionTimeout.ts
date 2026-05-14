import { useEffect, useRef, useCallback } from 'react';

const SESSION_TIMEOUT = 30 * 60 * 1000;

export function useSessionTimeout(onTimeout: () => void, isActive: boolean) {
  const timeoutRef = useRef<number | null>(null);
  const eventsRef = useRef<string[]>(['mousedown', 'keydown', 'touchstart', 'scroll']);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    if (isActive) {
      timeoutRef.current = window.setTimeout(() => {
        onTimeout();
      }, SESSION_TIMEOUT);
    }
  }, [onTimeout, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const handleActivity = () => resetTimer();

    eventsRef.current.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      eventsRef.current.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isActive, resetTimer]);

  return { resetTimer };
}
