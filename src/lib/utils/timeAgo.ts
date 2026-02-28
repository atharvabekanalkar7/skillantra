/**
 * Formats a timestamp as relative time.
 * - "just now" for < 1 minute
 * - "Z minutes ago" for < 60 minutes
 * - "A hours C minutes ago" for < 24 hours
 * - "X days Y hours ago" for >= 24 hours
 */
export function formatTimeAgo(timestamp: string | Date): string {
  const now = new Date();
  const past = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diffMs = now.getTime() - past.getTime();

  if (diffMs < 0) return 'just now';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    const remainingMinutes = diffMinutes - diffHours * 60;
    if (remainingMinutes === 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} ago`;
  } else {
    const remainingHours = diffHours - diffDays * 24;
    if (remainingHours === 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Formats a deadline timestamp into a countdown string.
 * Returns { text, expired } where text is the human-readable countdown
 * and expired indicates if the deadline has passed.
 */
export function formatCountdown(deadline: string | Date): { text: string; expired: boolean } {
  const now = new Date();
  const target = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { text: 'Applications Closed', expired: true };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (totalMinutes < 60) {
    return {
      text: `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''} remaining`,
      expired: false,
    };
  } else if (totalHours < 24) {
    const remainingMinutes = totalMinutes - totalHours * 60;
    return {
      text: `${totalHours} hour${totalHours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} remaining`,
      expired: false,
    };
  } else {
    const remainingHours = totalHours - totalDays * 24;
    return {
      text: `${totalDays} day${totalDays !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''} remaining`,
      expired: false,
    };
  }
}
