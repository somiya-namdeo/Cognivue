import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';

// ==========================================
// MOCK DATA GENERATION
// ==========================================

// 24 Hour attention vs cognitive load data
const attentionLoadData = [
  { time: '0:00', focus: 60, load: 35 },
  { time: '1:00', focus: 65, load: 38 },
  { time: '2:00', focus: 72, load: 45 },
  { time: '3:00', focus: 78, load: 50 },
  { time: '4:00', focus: 75, load: 55 },
  { time: '5:00', focus: 68, load: 58 },
  { time: '6:00', focus: 55, load: 50 },
  { time: '7:00', focus: 45, load: 42 },
  { time: '8:00', focus: 40, load: 35 },
  { time: '9:00', focus: 38, load: 30 },
  { time: '11:00', focus: 48, load: 40 },
  { time: '13:00', focus: 60, load: 52 },
  { time: '15:00', focus: 82, load: 58 },
  { time: '17:00', focus: 85, load: 60 },
  { time: '19:00', focus: 72, load: 68 },
  { time: '21:00', focus: 58, load: 65 },
  { time: '23:00', focus: 52, load: 50 },
];

// Weekly productivity bar data
const weeklyProductivityData = [
  { day: 'Mon', focus: 65, productivity: 58 },
  { day: 'Tue', focus: 70, productivity: 68 },
  { day: 'Wed', focus: 80, productivity: 62 },
  { day: 'Thu', focus: 85, productivity: 75 },
  { day: 'Fri', focus: 78, productivity: 82 },
  { day: 'Sat', focus: 55, productivity: 60 },
  { day: 'Sun', focus: 62, productivity: 70 },
];

// Realtime timeline data (30 elements representing minutes)
const initialRealtimeData = [
  { min: 0, load: 35 }, { min: 1, load: 42 }, { min: 2, load: 45 }, { min: 3, load: 45 },
  { min: 4, load: 52 }, { min: 5, load: 58 }, { min: 6, load: 62 }, { min: 7, load: 60 },
  { min: 8, load: 58 }, { min: 9, load: 52 }, { min: 10, load: 48 }, { min: 11, load: 40 },
  { min: 12, load: 36 }, { min: 13, load: 30 }, { min: 14, load: 24 }, { min: 15, load: 20 },
  { min: 16, load: 28 }, { min: 17, load: 32 }, { min: 18, load: 40 }, { min: 19, load: 45 },
  { min: 20, load: 48 }, { min: 21, load: 52 }, { min: 22, load: 55 }, { min: 23, load: 58 },
  { min: 24, load: 62 }, { min: 25, load: 62 }, { min: 26, load: 58 }, { min: 27, load: 50 },
  { min: 28, load: 44 }, { min: 29, load: 38 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    color?: string;
  }>;
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md text-left select-none">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
          Time: {label}
        </span>
        <div className="flex flex-col gap-1">
          {payload.map((item, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-zinc-400">
                {item.name}:
              </span>
              <span className="text-xs font-bold text-white">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// ==========================================
// 1. DUAL CURVED AREA CHART (Attention vs Load)
// ==========================================
interface AttentionLoadChartProps {
  data?: {
    time: string;
    focus: number;
    load: number;
  }[];
}

export const AttentionLoadChart: React.FC<AttentionLoadChartProps> = ({ data }) => {
  const chartData = data && data.length > 0 ? data : attentionLoadData;

  return (
    <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md shadow-lg select-none text-left relative overflow-hidden flex flex-col h-[380px]">
      
      {/* Title Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
            Focus trend · 24h
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight mt-0.5">
            Attention vs cognitive load
          </h3>
        </div>
        {/* Custom Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold select-none">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>Focus</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            <span>Load</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="glowCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="glowViolet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.03} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#4b5563" 
              tickLine={false} 
              axisLine={false}
              dy={10}
              style={{ fontSize: '9px', fontWeight: 'bold' }}
            />
            <YAxis 
              stroke="#4b5563" 
              tickLine={false} 
              axisLine={false} 
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              dx={-5}
              style={{ fontSize: '9px', fontWeight: 'bold' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.04)', strokeWidth: 1 }} />
            <Area 
              type="monotone" 
              name="Focus"
              dataKey="focus" 
              stroke="#06b6d4" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#glowCyan)"
              activeDot={{ r: 4, strokeWidth: 0, fill: '#06b6d4' }}
            />
            <Area 
              type="monotone" 
              name="Load"
              dataKey="load" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#glowViolet)"
              activeDot={{ r: 4, strokeWidth: 0, fill: '#8b5cf6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

interface FocusProductivityChartProps {
  data?: {
    day?: string;
    date?: string;
    focus: number;
    productivity: number;
  }[];
}

export const FocusProductivityChart: React.FC<FocusProductivityChartProps> = ({ data }) => {
  const chartData = (data && data.length > 0 ? data : weeklyProductivityData) as any[];
  const xKey = chartData[0] && 'date' in chartData[0] ? 'date' : 'day';

  return (
    <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md shadow-lg select-none text-left relative overflow-hidden flex flex-col h-[320px]">

      {/* Header */}
      <div className="mb-4">
        <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
          Weekly productivity
        </span>
        <h3 className="text-base font-extrabold text-white tracking-tight leading-tight mt-0.5">
          Focus vs productivity
        </h3>
      </div>

      {/* Chart container */}
      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" vertical={false} />
            <XAxis 
              dataKey={xKey} 
              stroke="#4b5563" 
              tickLine={false} 
              axisLine={false}
              dy={10}
              style={{ fontSize: '9px', fontWeight: 'bold' }}
            />
            <YAxis 
              stroke="#4b5563" 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              dx={-5}
              style={{ fontSize: '9px', fontWeight: 'bold' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.01)' }} />
            <Bar 
              name="Focus"
              dataKey="focus" 
              fill="#06b6d4" 
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Bar 
              name="Productivity"
              dataKey="productivity" 
              fill="#8b5cf6" 
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

// ==========================================
// 3. REALTIME TIMELINE CHART (Curved Line Chart)
// ==========================================
export const RealtimeLoadChart: React.FC = () => {
  const [data, setData] = useState(initialRealtimeData);

  // Dynamic fluctuation effect (adds tiny variations to simulate real-time)
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const nextData = [...prevData];
        // Shift data to the left
        nextData.shift();
        
        // Add new live value fluctuating around the last one
        const lastVal = prevData[prevData.length - 1].load;
        const fluctuation = (Math.random() - 0.5) * 8;
        let newVal = Math.round(lastVal + fluctuation);
        
        // Boundaries [20, 80]
        if (newVal < 20) newVal = 20;
        if (newVal > 80) newVal = 80;

        nextData.push({
          min: prevData[prevData.length - 1].min + 1,
          load: newVal
        });
        return nextData;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md shadow-lg select-none text-left relative overflow-hidden flex flex-col h-[320px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
            Cognitive load · last 30 min
          </span>
          <h3 className="text-base font-extrabold text-white tracking-tight leading-tight mt-0.5">
            Realtime load timeline
          </h3>
        </div>
        
        {/* Live pulsator */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span>Live</span>
        </div>
      </div>

      {/* Chart container */}
      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" vertical={false} />
            <XAxis 
              dataKey="min" 
              stroke="#4b5563" 
              tickLine={false} 
              axisLine={false}
              dy={10}
              style={{ fontSize: '9px', fontWeight: 'bold' }}
            />
            <YAxis 
              stroke="#4b5563" 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              dx={-5}
              style={{ fontSize: '9px', fontWeight: 'bold' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Line 
              type="monotone" 
              name="Load"
              dataKey="load" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#06b6d4' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
