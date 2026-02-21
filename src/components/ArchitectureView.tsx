import { useRef, useEffect, useState, useCallback } from 'react';

interface ArchitectureViewProps {
  onShowAuth?: () => void;
}

// ─── Color palette (matches CSS tokens) ──────────────────────────────
const COLORS = {
  primary:    { fill: 'hsl(185,80%,50%)', bg: 'hsla(185,80%,50%,0.12)', border: 'hsla(185,80%,50%,0.5)', text: 'hsl(185,80%,95%)' },
  accent:     { fill: 'hsl(160,70%,45%)', bg: 'hsla(160,70%,45%,0.12)', border: 'hsla(160,70%,45%,0.5)', text: 'hsl(160,70%,95%)' },
  warning:    { fill: 'hsl(38,90%,55%)',  bg: 'hsla(38,90%,55%,0.12)',  border: 'hsla(38,90%,55%,0.5)',  text: 'hsl(38,90%,95%)' },
  destructive:{ fill: 'hsl(0,70%,55%)',   bg: 'hsla(0,70%,55%,0.12)',   border: 'hsla(0,70%,55%,0.5)',   text: 'hsl(0,70%,95%)' },
  muted:      { fill: 'hsl(215,15%,55%)', bg: 'hsla(220,15%,18%,0.6)',  border: 'hsla(220,15%,20%,0.8)', text: 'hsl(210,20%,75%)' },
  bg:         'hsl(220,20%,6%)',
  cardBg:     'hsl(220,18%,10%)',
  line:       'hsla(185,80%,50%,0.35)',
  lineAccent: 'hsla(160,70%,45%,0.35)',
  lineWarn:   'hsla(38,90%,55%,0.35)',
  labelBg:    'hsla(220,18%,10%,0.9)',
};

// ─── Node definition ─────────────────────────────────────────────────
interface FlowNode {
  id: string;
  x: number; y: number; w: number; h: number;
  label: string; sublabel?: string;
  color: keyof typeof COLORS & ('primary' | 'accent' | 'warning' | 'destructive');
  shape?: 'rect' | 'rounded' | 'diamond' | 'stadium';
  glow?: boolean;
}

interface FlowEdge {
  from: string; to: string;
  label?: string;
  color?: string;
  dashed?: boolean;
}

interface FlowGroup {
  label: string; color: keyof typeof COLORS & ('primary' | 'accent' | 'warning' | 'muted');
  x: number; y: number; w: number; h: number;
}

// ─── Chart data ──────────────────────────────────────────────────────
const W = 960;
const H = 720;

const groups: FlowGroup[] = [
  { label: 'Browser / Client',      color: 'primary', x: 20,  y: 20,  w: 920, h: 100 },
  { label: 'Application Layer',     color: 'muted',   x: 20,  y: 170, w: 920, h: 110 },
  { label: 'Ethereum – Sepolia',    color: 'warning', x: 20,  y: 340, w: 440, h: 200 },
  { label: 'Lovable Cloud Backend', color: 'accent',  x: 500, y: 340, w: 440, h: 200 },
  { label: 'Data Flows',            color: 'muted',   x: 20,  y: 580, w: 920, h: 120 },
];

const nodes: FlowNode[] = [
  // Client
  { id: 'ui',       x: 160,  y: 55,  w: 150, h: 50, label: 'React UI',       sublabel: 'Vite + TypeScript', color: 'primary', glow: true },
  { id: 'mm',       x: 650,  y: 55,  w: 150, h: 50, label: 'MetaMask',       sublabel: 'Wallet Extension',  color: 'warning' },
  // App layer
  { id: 'w3ctx',    x: 60,   y: 210, w: 140, h: 44, label: 'Web3Context',    sublabel: 'Wallet State',      color: 'primary' },
  { id: 'useblk',   x: 260,  y: 210, w: 150, h: 44, label: 'useBlockchain',  sublabel: 'Contract Calls',    color: 'primary' },
  { id: 'usedata',  x: 510,  y: 210, w: 140, h: 44, label: 'useData',        sublabel: 'CRUD & Auth',       color: 'accent' },
  { id: 'useperf',  x: 740,  y: 210, w: 160, h: 44, label: 'usePerformance', sublabel: 'Metrics',           color: 'accent' },
  // Blockchain
  { id: 'sc',       x: 100,  y: 385, w: 170, h: 50, label: 'IoTBlockchain.sol', sublabel: 'Smart Contract', color: 'warning' },
  { id: 'event',    x: 100,  y: 475, w: 170, h: 50, label: 'DataRecorded',   sublabel: 'Event (id,hash)',   color: 'warning' },
  // Backend
  { id: 'auth',     x: 580,  y: 375, w: 140, h: 44, label: 'Auth Service',   sublabel: 'Email / Password',  color: 'accent' },
  { id: 'db',       x: 780,  y: 375, w: 130, h: 44, label: 'PostgreSQL',     sublabel: 'Database',          color: 'accent' },
  { id: 'rls',      x: 680,  y: 470, w: 140, h: 44, label: 'Row Level Security', sublabel: 'Per-user isolation', color: 'accent' },
  // Data flows
  { id: 'record',   x: 60,   y: 620, w: 130, h: 44, label: 'Record Data',    sublabel: 'IoT → Hash → TX',   color: 'primary' },
  { id: 'verify',   x: 250,  y: 620, w: 130, h: 44, label: 'Verify',         sublabel: 'Compare hashes',    color: 'accent' },
  { id: 'wallet',   x: 440,  y: 620, w: 130, h: 44, label: 'Wallet Flow',    sublabel: 'Connect → Sepolia', color: 'warning' },
  { id: 'authflow', x: 630,  y: 620, w: 130, h: 44, label: 'Auth Flow',      sublabel: 'Login → JWT',       color: 'accent' },
  { id: 'perf',     x: 810,  y: 620, w: 120, h: 44, label: 'Perf Metrics',   sublabel: 'Collect & Chart',   color: 'primary' },
];

const edges: FlowEdge[] = [
  { from: 'ui',      to: 'mm',      label: 'wallet',       color: COLORS.lineWarn },
  { from: 'ui',      to: 'w3ctx',   label: 'context',      color: COLORS.line },
  { from: 'ui',      to: 'usedata', label: 'hooks',        color: COLORS.lineAccent },
  { from: 'w3ctx',   to: 'mm',      label: '',             color: COLORS.lineWarn, dashed: true },
  { from: 'w3ctx',   to: 'useblk',  label: '',             color: COLORS.line },
  { from: 'useblk',  to: 'sc',      label: 'ethers.js',    color: COLORS.lineWarn },
  { from: 'sc',      to: 'event',   label: 'emits',        color: COLORS.lineWarn },
  { from: 'usedata', to: 'auth',    label: 'supabase-js',  color: COLORS.lineAccent },
  { from: 'usedata', to: 'db',      label: '',             color: COLORS.lineAccent },
  { from: 'auth',    to: 'db',      label: '',             color: COLORS.lineAccent, dashed: true },
  { from: 'db',      to: 'rls',     label: 'enforces',     color: COLORS.lineAccent },
  { from: 'useperf', to: 'db',      label: 'metrics',      color: COLORS.lineAccent, dashed: true },
];

function getNodeCenter(id: string): { x: number; y: number } {
  const n = nodes.find(n => n.id === id)!;
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

export function ArchitectureView({ onShowAuth }: ArchitectureViewProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System <span className="text-primary text-glow-primary">Architecture</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hybrid IoT Blockchain platform — interactive flowchart
        </p>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-border/50 bg-card/60 backdrop-blur p-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[700px]"
          style={{ maxHeight: '75vh' }}
        >
          <defs>
            {/* Glow filter */}
            <filter id="glow-f" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Arrow markers */}
            {['primary','accent','warning'].map(c => (
              <marker key={c} id={`arrow-${c}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS[c as 'primary'].fill} fillOpacity="0.7" />
              </marker>
            ))}
            <marker id="arrow-default" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.primary.fill} fillOpacity="0.5" />
            </marker>
          </defs>

          {/* Groups */}
          {groups.map(g => {
            const c = COLORS[g.color];
            return (
              <g key={g.label}>
                <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={12}
                  fill={c.bg} stroke={c.border} strokeWidth={1.5} strokeDasharray="6 3" />
                <text x={g.x + 14} y={g.y + 18} fill={c.fill} fontSize={10} fontWeight={700}
                  letterSpacing="0.08em" textAnchor="start" style={{ textTransform: 'uppercase' }}>
                  {g.label}
                </text>
              </g>
            );
          })}

          {/* Edges */}
          {edges.map((e, i) => {
            const from = getNodeCenter(e.from);
            const to = getNodeCenter(e.to);
            const isHighlighted = hovered === e.from || hovered === e.to;
            const markerColor = e.color === COLORS.lineWarn ? 'warning' : e.color === COLORS.lineAccent ? 'accent' : 'primary';

            // Simple line with midpoint for label
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;

            return (
              <g key={i}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={e.color || COLORS.line}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={e.dashed ? '5 4' : undefined}
                  markerEnd={`url(#arrow-${markerColor})`}
                  opacity={isHighlighted ? 1 : 0.6}
                  style={{ transition: 'all 0.2s' }}
                />
                {e.label && (
                  <>
                    <rect x={mx - 28} y={my - 8} width={56} height={16} rx={4}
                      fill={COLORS.labelBg} />
                    <text x={mx} y={my + 4} fill={COLORS.muted.text} fontSize={8}
                      fontWeight={600} textAnchor="middle">{e.label}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const c = COLORS[n.color];
            const isHov = hovered === n.id;
            return (
              <g key={n.id}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              >
                <rect
                  x={n.x} y={n.y} width={n.w} height={n.h} rx={10}
                  fill={c.bg} stroke={c.border}
                  strokeWidth={isHov ? 2.5 : 1.5}
                  filter={n.glow || isHov ? 'url(#glow-f)' : undefined}
                  style={{ transition: 'all 0.2s' }}
                />
                <text x={n.x + n.w / 2} y={n.y + (n.sublabel ? n.h / 2 - 4 : n.h / 2 + 4)}
                  fill={c.fill} fontSize={11} fontWeight={700} textAnchor="middle">
                  {n.label}
                </text>
                {n.sublabel && (
                  <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 12}
                    fill={COLORS.muted.text} fontSize={9} textAnchor="middle">
                    {n.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px] px-1">
        {[
          { label: 'Frontend / Blockchain hooks', color: COLORS.primary.fill },
          { label: 'Backend / Data layer',        color: COLORS.accent.fill },
          { label: 'Ethereum / Smart Contract',   color: COLORS.warning.fill },
          { label: 'Dashed = secondary link',     color: COLORS.muted.fill },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArchitectureView;
