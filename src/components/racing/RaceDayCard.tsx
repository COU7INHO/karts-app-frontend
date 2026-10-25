import { Link } from 'react-router-dom';
import { Flag, ChevronRight } from 'lucide-react';
import type { RaceDay } from '@/lib/race';
import { formatRaceDate } from '@/lib/timing';

// One race day: date block on the left, a button per session
const RaceDayCard = ({ day, showCircuit = true }: { day: RaceDay; showCircuit?: boolean }) => (
  <div className="panel flex items-stretch overflow-hidden">
    <div className="w-[4.5rem] shrink-0 flex flex-col items-center justify-center bg-secondary/60 border-r border-border py-3">
      <span className="display text-4xl leading-none">{formatRaceDate(day.date, 'd')}</span>
      <span className="text-xs text-muted-foreground mt-1">{formatRaceDate(day.date, 'MMM yy')}</span>
    </div>
    <div className="flex-1 min-w-0 p-3 md:p-4">
      <p className="font-semibold truncate">{showCircuit ? day.circuitName : formatRaceDate(day.date, 'EEEE')}</p>
      {showCircuit && <p className="text-xs text-muted-foreground">{formatRaceDate(day.date, 'EEEE')}</p>}
      <div className="flex flex-wrap gap-2 mt-3">
        {day.sessions.map((session, i) => (
          <Link
            key={session.id}
            to={`/races/${session.id}`}
            className="group inline-flex items-center gap-1.5 h-9 pl-3 pr-2 text-sm rounded-sm bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            {day.sessions.length > 1 ? `Race ${i + 1}` : 'Results'}
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default RaceDayCard;
