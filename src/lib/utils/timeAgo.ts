/**
 * Formats a timestamp as "Xm ago" or "Xh ago"
 * - Xm ago for < 60 minutes
 * - Xh ago for >= 60 minutes
 */
export function formatTimeAgo(timestamp: string | Date): string {
  const now = new Date();
  const past = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else {
    return `${diffHours}h ago`;
  }
}

