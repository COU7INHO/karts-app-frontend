import type { Race, RaceResult } from './api';
import { timeToSeconds } from './timing';

// Positions are decided by fastest lap, fastest first
export const sortByFastestLap = (results: RaceResult[]): RaceResult[] =>
  [...results].sort(
    (a, b) => (timeToSeconds(a.fastest_lap) ?? Infinity) - (timeToSeconds(b.fastest_lap) ?? Infinity)
  );

export interface RaceDay {
  key: string;
  date: string;
  circuitName: string;
  /** Sessions in running order (lowest id first) */
  sessions: Race[];
}

// Several sessions are usually run on the same day at the same track
export const groupRaceDays = (races: Race[]): RaceDay[] => {
  const days = new Map<string, RaceDay>();
  races.forEach(race => {
    const circuitName = race.circuit_name ?? 'Unknown circuit';
    const key = `${race.date}|${circuitName}`;
    const day = days.get(key) ?? { key, date: race.date, circuitName, sessions: [] };
    day.sessions.push(race);
    days.set(key, day);
  });
  return [...days.values()]
    .map(day => ({ ...day, sessions: [...day.sessions].sort((a, b) => a.id - b.id) }))
    .sort((a, b) => b.date.localeCompare(a.date));
};
