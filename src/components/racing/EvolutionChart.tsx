import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartAxis, formatLapSeconds, formatRaceDate, shortLap } from '@/lib/timing';

export interface EvolutionPoint {
  date: string;
  race_id?: number;
  fastest: number | null;
  average: number | null;
  fastest_display?: string;
  average_display?: string;
}

interface EvolutionChartProps {
  data: EvolutionPoint[];
  onPointClick?: (point: EvolutionPoint) => void;
  fastestLabel?: string;
  averageLabel?: string;
}

const PURPLE = 'hsl(var(--purple))';
const AVERAGE = 'hsl(var(--average))';

// Fastest lap and average lap over time, one line each
const EvolutionChart = ({
  data,
  onPointClick,
  fastestLabel = 'Fastest lap',
  averageLabel = 'Average lap',
}: EvolutionChartProps) => {
  const values = data.flatMap(d => [d.fastest, d.average]).filter((v): v is number => v !== null);
  const domain = values.length ? [Math.max(0, Math.min(...values) - 1), Math.max(...values) + 1] : [0, 60];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const point: EvolutionPoint = payload[0].payload;
    return (
      <div className="panel p-3 shadow-xl text-sm">
        <p className="font-semibold mb-1.5">{formatRaceDate(point.date)}</p>
        <p className="flex justify-between gap-6 t-purple">
          <span>{fastestLabel}</span>
          <span className="lap-time">{shortLap(point.fastest_display)}</span>
        </p>
        <p className="flex justify-between gap-6 t-avg">
          <span>{averageLabel}</span>
          <span className="lap-time">{shortLap(point.average_display)}</span>
        </p>
        {onPointClick && <p className="text-xs text-muted-foreground mt-1.5">Tap to open the race</p>}
      </div>
    );
  };

  return (
    <div>
      <div className="flex gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{ background: PURPLE }} /> {fastestLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{ background: AVERAGE }} /> {averageLabel}
        </span>
      </div>
      <div className="h-72 md:h-80 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            onClick={(e: any) => {
              const point = e?.activePayload?.[0]?.payload;
              if (point && onPointClick) onPointClick(point);
            }}
          >
            <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="date" {...chartAxis} tickFormatter={v => formatRaceDate(v, 'MMM yy')} minTickGap={24} />
            <YAxis
              {...chartAxis}
              width={52}
              domain={domain}
              tickFormatter={v => formatLapSeconds(v, 1).replace(/^0:/, '')}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }} />
            <Line
              type="monotone"
              dataKey="fastest"
              stroke={PURPLE}
              strokeWidth={2}
              dot={{ r: 3, fill: PURPLE, strokeWidth: 0 }}
              activeDot={{ r: 5, cursor: onPointClick ? 'pointer' : undefined }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke={AVERAGE}
              strokeWidth={2}
              dot={{ r: 3, fill: AVERAGE, strokeWidth: 0 }}
              activeDot={{ r: 5, cursor: onPointClick ? 'pointer' : undefined }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvolutionChart;
