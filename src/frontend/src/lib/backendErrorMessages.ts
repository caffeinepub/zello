import { BackendError } from '../backend';

/**
 * Converts backend structured error values into user-friendly English messages.
 */
export function getBackendErrorMessage(error: BackendError): string {
  switch (error) {
    case BackendError.displayNameEmpty:
      return 'Display name cannot be empty. Please enter your name.';
    case BackendError.participantIdEmpty:
      return 'Participant ID is missing. Please refresh the page and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
