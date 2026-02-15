/**
 * Detects and extracts information from replica reject/rejection errors.
 * Returns a user-friendly error message including request ID when available.
 */
export function handleReplicaRejectError(error: unknown): string | null {
  if (!error) return null;

  const errorString = error instanceof Error ? error.message : String(error);
  const lowerError = errorString.toLowerCase();

  // Check if this looks like a replica reject error
  if (
    lowerError.includes('reject') ||
    lowerError.includes('rejection') ||
    lowerError.includes('replica')
  ) {
    // Try to extract request ID from common patterns
    const requestIdMatch = errorString.match(/request[_ ]id[:\s]+([a-zA-Z0-9-]+)/i);
    const requestId = requestIdMatch ? requestIdMatch[1] : null;

    if (requestId) {
      return `The request was rejected by the network. Request ID: ${requestId}. Please try again.`;
    }

    return 'The request was rejected by the network. Please try again in a moment.';
  }

  return null;
}
