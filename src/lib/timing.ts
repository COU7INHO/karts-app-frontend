import { format, parseISO } from 'date-fns';

// "m:ss.xxx" (or "h:mm:ss.xxx") -> seconds
export const timeToSeconds = (time: string | null | undefined): number | null => {
  if (!time) return null;
  const parts = time.split(':').map(parseFloat);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
};

// seconds -> "m:ss.xxx"
export const formatLapSeconds = (seconds: number, decimals = 3): string => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(decimals);
  return `${mins}:${secs.padStart(decimals + 3, '0')}`;
};

// Gap to the reference time, broadcast style: "+0.138" / "+1:02.310"
export const formatGap = (seconds: number | null, reference: number | null): string => {
  if (seconds === null || reference === null) return '';
  const diff = seconds - reference;
  if (diff <= 0) return '';
  return diff >= 60 ? `+${formatLapSeconds(diff)}` : `+${diff.toFixed(3)}`;
};

// Drop the leading "0:" so lap times read like a timing screen: 36.076
export const shortLap = (time: string | null | undefined): string => {
  if (!time) return '—';
  return time.startsWith('0:') ? time.slice(2) : time;
};

export const formatRaceDate = (date: string, pattern = 'd MMM yyyy'): string => {
  try {
    return format(parseISO(date), pattern);
  } catch {
    return date;
  }
};

// Golden-angle hues keep series distinct; tuned to read on the asphalt background
export const getDriverColor = (index: number): string => {
  const hue = Math.round((index * 137.508 + 48) % 360);
  return `hsl(${hue}, 85%, 62%)`;
};

export const chartAxis = {
  stroke: 'hsl(var(--border))',
  tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 },
  tickLine: false,
};
