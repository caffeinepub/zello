const SESSION_KEY = 'zello_session';
const PARTICIPANT_ID_KEY = 'zello_participant_id';

interface StoredSession {
  code: string;
  displayName: string;
  participantId: string;
}

function generateParticipantId(): string {
  return `participant_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function getOrCreateParticipantId(): string {
  try {
    let participantId = sessionStorage.getItem(PARTICIPANT_ID_KEY);
    if (!participantId) {
      participantId = generateParticipantId();
      sessionStorage.setItem(PARTICIPANT_ID_KEY, participantId);
    }
    return participantId;
  } catch (error) {
    console.error('Failed to get/create participant ID:', error);
    return generateParticipantId();
  }
}

export function storeSession(code: string, displayName: string, participantId: string): void {
  try {
    const session: StoredSession = { code, displayName, participantId };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to store session:', error);
  }
}

export function getStoredSession(): StoredSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredSession;
  } catch (error) {
    console.error('Failed to retrieve session:', error);
    return null;
  }
}

export function clearStoredSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}
