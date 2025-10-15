// Market hours and trading utilities
// Determines if the Indian stock market is open and handles market holidays

export function isMarketOpen(): boolean {
  const now = new Date();

  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const dayOfWeek = istDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const currentTime = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15;
  const marketClose = 15 * 60 + 30;

  if (currentTime < marketOpen || currentTime > marketClose) {
    return false;
  }

  const holidays = [
    '2025-01-26',
    '2025-03-14',
    '2025-03-31',
    '2025-04-10',
    '2025-04-14',
    '2025-04-18',
    '2025-05-01',
    '2025-08-15',
    '2025-08-27',
    '2025-10-02',
    '2025-10-21',
    '2025-11-01',
    '2025-11-05',
  ];

  const dateStr = istDate.toISOString().split('T')[0];
  if (holidays.includes(dateStr)) {
    return false;
  }

  return true;
}

export function getNextMarketOpenTime(): string {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  let nextDay = new Date(istDate);
  nextDay.setDate(nextDay.getDate() + 1);

  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(dateStr);
}

export function formatChartDate(dateStr: string, timeRange: string): string {
  const date = new Date(dateStr);

  switch (timeRange) {
    case '1M':
    case '3M':
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    case '6M':
    case '1Y':
      return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    case 'ALL':
      return date.toLocaleDateString('en-IN', { year: 'numeric' });
    default:
      return formatDate(dateStr);
  }
}
