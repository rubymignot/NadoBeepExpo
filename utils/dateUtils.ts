export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInMilliseconds = then.getTime() - now.getTime();
  const isFuture = diffInMilliseconds > 0;
  const diffInMinutes = Math.floor(Math.abs(diffInMilliseconds) / (1000 * 60));

  if (diffInMinutes < 1) return 'just now';
  
  if (diffInMinutes === 1) return isFuture ? 'in 1 minute' : '1 minute ago';
  if (diffInMinutes < 60) return isFuture ? `in ${diffInMinutes} minutes` : `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return isFuture ? 'in 1 hour' : '1 hour ago';
  if (diffInHours < 24) return isFuture ? `in ${diffInHours} hours` : `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return isFuture ? 'in 1 day' : '1 day ago';
  return isFuture ? `in ${diffInDays} days` : `${diffInDays} days ago`;
}
