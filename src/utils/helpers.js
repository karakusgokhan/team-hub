/**
 * Date and formatting helpers for HarmonyHub
 */

// Returns today's date as YYYY-MM-DD in the user's LOCAL timezone.
// Do NOT use toISOString() here — it returns UTC, which can be one day
// behind in timezones ahead of UTC (e.g. Istanbul UTC+3 before 3 AM).
export const todayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  const y  = date.getFullYear();
  const m  = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// Returns the Sunday of the week that starts on the given Monday string
export const getSunday = (mondayStr) => {
  const d = new Date(mondayStr + 'T12:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
};

// Offset a Monday date string by N weeks (positive = future, negative = past)
export const offsetWeek = (mondayStr, weeks) => {
  const d = new Date(mondayStr + 'T12:00:00');
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split('T')[0];
};

export const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const getWeekDays = () => {
  // Use noon anchor to avoid UTC-midnight timezone shifts
  const monday = new Date(getMonday(new Date()) + 'T12:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

/**
 * WhatsApp share helper — opens wa.me with pre-formatted text
 * User picks the group chat and hits send
 */
export const shareToWhatsApp = (text) => {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
};
