// 90 -> "1h 30m", 45 -> "45 min", 120 -> "2h"
export function formatDuration(min?: number | null): string {
  const m = Math.round(Number(min) || 0);
  if (m <= 0) return '';
  const h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r} min`;
}

// "10:00" + 90 -> "11:30"
export function endTime(time: string, duration?: number | null): string {
  const [h, m] = time.split(':').map(Number);
  const t = h * 60 + m + (duration || 60);
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

// "13:30" -> "1:30 PM" (customer ko 12 ghante wala waqt zyada samajh aata hai)
export function to12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
