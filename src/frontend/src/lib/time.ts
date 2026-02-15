export function formatTimestamp(timestamp: bigint): string {
  // Convert nanoseconds to milliseconds
  const ms = Number(timestamp / 1_000_000n);
  const date = new Date(ms);
  
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    // Show time only for today's messages
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    // Show date and time for older messages
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}
