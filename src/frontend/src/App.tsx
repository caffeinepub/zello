import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import { getStoredSession, clearStoredSession } from './lib/sessionStorage';
import { ThemeModeProvider } from './context/ThemeModeContext';

export default function App() {
  const [activeSession, setActiveSession] = useState<{
    code: string;
    displayName: string;
    participantId: string;
  } | null>(null);

  useEffect(() => {
    // Try to restore session from storage on mount
    const stored = getStoredSession();
    if (stored) {
      setActiveSession(stored);
    }
  }, []);

  const handleSessionStart = (code: string, displayName: string, participantId: string) => {
    setActiveSession({ code, displayName, participantId });
  };

  const handleLeaveSession = () => {
    clearStoredSession();
    setActiveSession(null);
  };

  return (
    <ThemeModeProvider>
      <div className="min-h-screen bg-background">
        {activeSession ? (
          <ChatPage
            code={activeSession.code}
            displayName={activeSession.displayName}
            participantId={activeSession.participantId}
            onLeave={handleLeaveSession}
          />
        ) : (
          <LandingPage onSessionStart={handleSessionStart} />
        )}
      </div>
    </ThemeModeProvider>
  );
}
