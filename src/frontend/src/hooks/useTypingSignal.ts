import { useCallback, useRef } from 'react';
import { useActor } from './useActor';

const TYPING_THROTTLE = 1500; // Send typing signal every 1.5s max
const TYPING_TIMEOUT = 3000; // Stop typing after 3s of inactivity

export function useTypingSignal(code: string, participantId: string) {
  const { actor } = useActor();
  const lastSignalRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendTypingSignal = useCallback(async () => {
    if (!actor) return;
    
    const now = Date.now();
    if (now - lastSignalRef.current < TYPING_THROTTLE) {
      return; // Throttle
    }

    lastSignalRef.current = now;
    try {
      await actor.updateTypingIndicator(code, participantId);
    } catch (error) {
      // Silently fail - typing indicators are not critical
      console.debug('Typing indicator update failed:', error);
    }
  }, [actor, code, participantId]);

  const handleTyping = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Send signal
    sendTypingSignal();

    // Set timeout to stop typing
    timeoutRef.current = setTimeout(() => {
      // Typing stopped naturally
    }, TYPING_TIMEOUT);
  }, [sendTypingSignal]);

  const clearTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    handleTyping,
    clearTyping,
  };
}
