const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const shortDateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const longDateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
const dayLabelFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysAgo = (date) => Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);

/** 10:42 AM */
export const formatTime = (value) => timeFormat.format(new Date(value));

/** Contact list: time today, "Yesterday", weekday this week, else short date. */
export function formatContactTime(value) {
  const date = new Date(value);
  const diff = daysAgo(date);
  if (diff === 0) return timeFormat.format(date);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return weekdayFormat.format(date);
  return shortDateFormat.format(date);
}

/** Divider between days in a conversation. */
export function formatDayLabel(value) {
  const date = new Date(value);
  const diff = daysAgo(date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (date.getFullYear() === new Date().getFullYear()) return dayLabelFormat.format(date);
  return longDateFormat.format(date);
}

export const isSameDay = (a, b) => startOfDay(new Date(a)) === startOfDay(new Date(b));

/** "Last seen 5 min ago" */
export function formatLastSeen(value) {
  if (!value) return 'Offline';
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'Last seen just now';
  if (seconds < 3600) return `Last seen ${Math.floor(seconds / 60)} min ago`;
  if (daysAgo(new Date(value)) === 0) return `Last seen today at ${formatTime(value)}`;
  if (daysAgo(new Date(value)) === 1) return `Last seen yesterday at ${formatTime(value)}`;
  return `Last seen ${shortDateFormat.format(new Date(value))}`;
}

export const formatMemberSince = (value) => longDateFormat.format(new Date(value));

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const firstName = (fullName = '') => fullName.trim().split(/\s+/)[0] ?? '';
