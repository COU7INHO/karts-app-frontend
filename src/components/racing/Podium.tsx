import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface PodiumEntry {
  key: string | number;
  name: string;
  href?: string;
  value: React.ReactNode;
}

interface PodiumProps {
  entries: PodiumEntry[];
  /** Small label on the left of the top bar */
  title?: string;
  /** Yellow tag on the right of the top bar */
  tag?: string;
  /** Colour of the winner's value (purple for lap times, yellow for points) */
  highlightClassName?: string;
}

// Each driver stands just above their block: horizontal centre of the block
// and distance from the bottom of the podium box to the block's top edge
const SPOTS = [
  { position: 1, left: '51%', bottom: '60%' },
  { position: 2, left: '19.5%', bottom: '49.5%' },
  { position: 3, left: '84%', bottom: '42.5%' },
];

/**
 * 3D podium artwork with the top three drivers placed over the silver, gold
 * and bronze blocks. Text is sized in container units so it scales with the
 * podium's own width, whatever column it sits in.
 */
const Podium = ({ entries, title, tag, highlightClassName = 't-purple' }: PodiumProps) => (
  <div>
    {(title || tag) && (
      <div className="flex justify-between gap-4 text-xs font-extrabold tracking-[0.12em] uppercase text-muted-foreground">
        <span>{title}</span>
        {tag && <span className="text-primary">★ {tag}</span>}
      </div>
    )}
    <div className="relative w-full aspect-[1448/811] isolate [container-type:inline-size]">
      <img
        src="/brand/podium.webp"
        alt=""
        aria-hidden
        draggable={false}
        className="absolute left-0 bottom-0 w-full h-auto pointer-events-none select-none animate-podium-in"
      />
      {SPOTS.map(spot => {
        const entry = entries[spot.position - 1];
        if (!entry) return null;
        const first = spot.position === 1;
        return (
          <div
            key={entry.key}
            className="absolute z-10 -translate-x-1/2 w-[27%] flex flex-col items-center text-center gap-[0.6cqw] animate-fade-in"
            style={{ left: spot.left, bottom: spot.bottom }}
          >
            <span
              className="plate aspect-square"
              style={{
                width: 'max(24px, 7cqw)',
                fontSize: 'max(12px, 3.6cqw)',
                boxShadow: `inset 0 0 0 2px hsl(var(--primary)), inset 0 0 0 3.5px hsl(var(--primary-foreground) / 0.85), 0 0 ${first ? 20 : 18}px hsl(var(--primary) / ${first ? 0.45 : 0.22})`,
              }}
              aria-hidden
            >
              {entry.name.charAt(0).toUpperCase()}
            </span>
            <span
              className="display max-w-full truncate [text-shadow:0_2px_6px_#000]"
              style={{ fontSize: 'max(12px, 3.4cqw)' }}
            >
              {entry.href ? (
                <Link to={entry.href} className="hover:text-primary transition-colors">
                  {entry.name}
                </Link>
              ) : (
                entry.name
              )}
            </span>
            <span
              className={cn(
                'display lap-time [text-shadow:0_2px_6px_#000]',
                first ? highlightClassName : 'text-[#aeb7ca]'
              )}
              style={{ fontSize: 'max(12px, 3.8cqw)' }}
            >
              {entry.value}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

export default Podium;
