import { 
  Database, Server, Shield, Cpu, Globe, Box, 
  ArrowRight, ArrowDown, Layers, Lock, Zap, Hash,
  Monitor, Wallet, FileCode, Users, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ArchitectureViewProps {
  onShowAuth?: () => void;
}

// ─── Reusable diagram node ───────────────────────────────────────────
function DiagramNode({ 
  icon: Icon, label, sublabel, color = 'primary', glow = false 
}: { 
  icon: React.ElementType; label: string; sublabel?: string; 
  color?: 'primary' | 'accent' | 'warning' | 'destructive'; glow?: boolean;
}) {
  const colorMap = {
    primary:     'border-primary/40 bg-primary/10 text-primary',
    accent:      'border-accent/40 bg-accent/10 text-accent',
    warning:     'border-warning/40 bg-warning/10 text-warning',
    destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
  };
  const iconColor = {
    primary: 'text-primary', accent: 'text-accent', 
    warning: 'text-warning', destructive: 'text-destructive',
  };

  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-3 ${colorMap[color]} ${glow ? 'glow-primary' : ''} transition-all hover:scale-105`}>
      <Icon className={`h-6 w-6 ${iconColor[color]}`} />
      <span className="text-xs font-bold tracking-wide uppercase">{label}</span>
      {sublabel && <span className="text-[10px] text-muted-foreground text-center leading-tight">{sublabel}</span>}
    </div>
  );
}

function Connector({ direction = 'right', label }: { direction?: 'right' | 'down'; label?: string }) {
  if (direction === 'down') {
    return (
      <div className="flex flex-col items-center gap-0.5 py-1">
        <ArrowDown className="h-5 w-5 text-muted-foreground animate-pulse-slow" />
        {label && <span className="text-[9px] text-muted-foreground">{label}</span>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 px-1">
      <ArrowRight className="h-5 w-5 text-muted-foreground animate-pulse-slow" />
      {label && <span className="text-[9px] text-muted-foreground">{label}</span>}
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────
function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          {title}
          {badge && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">{badge}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ArchitectureView({ onShowAuth }: ArchitectureViewProps) {
  return (
    <div className="space-y-8 animate-slide-in">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System <span className="text-primary text-glow-primary">Architecture</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hybrid IoT Blockchain platform — architecture overview &amp; data flows
        </p>
      </div>

      {/* ── 1. High-Level Architecture ──────────────────────────────── */}
      <Section title="High-Level Architecture" badge="Overview">
        <div className="flex flex-col items-center gap-2">
          {/* Client row */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <DiagramNode icon={Monitor} label="React UI" sublabel="Vite + TypeScript" color="primary" glow />
            <Connector label="wallet" />
            <DiagramNode icon={Wallet} label="MetaMask" sublabel="Browser Extension" color="warning" />
          </div>

          <Connector direction="down" label="hooks & context" />

          {/* App layer row */}
          <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 w-full">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 text-center">Application Layer</p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <DiagramNode icon={Globe} label="Web3Context" sublabel="Wallet State" color="primary" />
              <DiagramNode icon={Zap} label="useBlockchain" sublabel="Contract Calls" color="primary" />
              <DiagramNode icon={Database} label="useData" sublabel="CRUD & Auth" color="accent" />
              <DiagramNode icon={Activity} label="usePerformance" sublabel="Metrics" color="accent" />
            </div>
          </div>

          <div className="flex items-center gap-12">
            <Connector direction="down" label="ethers.js" />
            <Connector direction="down" label="supabase-js" />
          </div>

          {/* Backend row */}
          <div className="flex items-start gap-6 flex-wrap justify-center w-full">
            {/* Blockchain */}
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex-1 min-w-[220px]">
              <p className="text-[10px] uppercase tracking-widest text-warning mb-3 text-center">Ethereum — Sepolia Testnet</p>
              <div className="flex flex-col items-center gap-2">
                <DiagramNode icon={FileCode} label="IoTBlockchain.sol" sublabel="Smart Contract" color="warning" />
                <Connector direction="down" label="emits" />
                <DiagramNode icon={Hash} label="DataRecorded" sublabel="Event (id, sender, hash)" color="warning" />
              </div>
            </div>

            {/* Cloud backend */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex-1 min-w-[220px]">
              <p className="text-[10px] uppercase tracking-widest text-accent mb-3 text-center">Lovable Cloud Backend</p>
              <div className="flex flex-col items-center gap-2">
                <DiagramNode icon={Users} label="Auth Service" sublabel="Email / Password" color="accent" />
                <Connector direction="down" />
                <DiagramNode icon={Database} label="PostgreSQL" sublabel="Database" color="accent" />
                <Connector direction="down" />
                <DiagramNode icon={Lock} label="RLS" sublabel="Per-user isolation" color="accent" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 2. Database Schema ─────────────────────────────────────── */}
      <Section title="Database Schema" badge="ER Diagram">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SchemaCard name="user_profiles" color="accent" fields={['id (PK)', 'user_id (UK)', 'email', 'display_name', 'is_active', 'last_login_at']} />
          <SchemaCard name="user_roles" color="accent" fields={['id (PK)', 'user_id', 'role (enum)', 'created_at']} />
          <SchemaCard name="devices" color="primary" fields={['id (PK)', 'user_id', 'address', 'name', 'device_type', 'location', 'active', 'permission_level']} />
          <SchemaCard name="nodes" color="primary" fields={['id (PK)', 'user_id', 'address', 'name', 'active', 'is_validator']} />
          <SchemaCard name="data_records" color="warning" fields={['id (PK)', 'user_id', 'record_id', 'device_address', 'data_hash', 'tx_hash', 'temperature', 'humidity', 'raw_data']} />
          <SchemaCard name="performance_metrics" color="accent" fields={['id (PK)', 'user_id', 'metric_type', 'metric_name', 'value_ms', 'metadata']} />
          <SchemaCard name="login_activity" color="destructive" fields={['id (PK)', 'user_id', 'email', 'action', 'ip_address', 'user_agent']} />
        </div>

        {/* Relationships */}
        <div className="mt-4 p-3 rounded-lg bg-secondary/40 border border-border/40">
          <p className="text-xs font-semibold text-foreground mb-2">Relationships</p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <Badge variant="outline" className="border-accent/40 text-accent">user_profiles → devices (1:N)</Badge>
            <Badge variant="outline" className="border-accent/40 text-accent">user_profiles → nodes (1:N)</Badge>
            <Badge variant="outline" className="border-warning/40 text-warning">user_profiles → data_records (1:N)</Badge>
            <Badge variant="outline" className="border-primary/40 text-primary">devices → data_records (1:N)</Badge>
            <Badge variant="outline" className="border-accent/40 text-accent">user_profiles → user_roles (1:1)</Badge>
          </div>
        </div>
      </Section>

      {/* ── 3. Smart Contract ──────────────────────────────────────── */}
      <Section title="Smart Contract" badge="Solidity 0.8.28">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <div className="rounded-xl border-2 border-warning/40 bg-warning/5 p-5 min-w-[200px]">
            <p className="text-xs font-bold text-warning mb-3 text-center">IoTBlockchain</p>
            <div className="space-y-1 text-[11px] font-mono text-muted-foreground">
              <p><span className="text-accent">+</span> address owner</p>
              <p><span className="text-accent">+</span> uint256 recordCount</p>
              <p className="border-t border-border/30 pt-1"><span className="text-primary">+</span> record(bytes32 _hash) → uint256</p>
              <p><span className="text-primary">+</span> transferOwnership(address)</p>
              <p><span className="text-destructive">-</span> onlyOwner modifier</p>
            </div>
          </div>

          <Connector label="emits" />

          <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 min-w-[200px]">
            <p className="text-xs font-bold text-primary mb-3 text-center">DataRecorded «event»</p>
            <div className="space-y-1 text-[11px] font-mono text-muted-foreground">
              <p><span className="text-accent">+</span> uint256 id</p>
              <p><span className="text-accent">+</span> address sender</p>
              <p><span className="text-accent">+</span> bytes32 dataHash</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <Badge variant="outline" className="border-warning/40 text-warning">Sepolia Testnet</Badge>
          <Badge variant="outline" className="border-primary/40 text-primary font-mono">0x0C7e3d...0573eB</Badge>
          <Badge variant="outline" className="border-accent/40 text-accent">Proof-only — keccak256 hashes on-chain</Badge>
        </div>
      </Section>

      {/* ── 4. Key Flows Summary ───────────────────────────────────── */}
      <Section title="Key Data Flows" badge="Flowcharts">
        <div className="grid gap-3 sm:grid-cols-2">
          <FlowCard title="IoT Data Recording" color="primary" steps={['User fills form', 'Validate inputs (zod)', 'Generate keccak256 hash', 'MetaMask → submit tx', 'Parse DataRecorded event', 'Save to database']} />
          <FlowCard title="Data Verification" color="accent" steps={['Enter tx hash / record ID', 'Query database', 'Fetch on-chain receipt', 'Compare hashes', '✅ Verified or ❌ Mismatch']} />
          <FlowCard title="Wallet Connection" color="warning" steps={['Detect MetaMask', 'eth_requestAccounts', 'Verify Sepolia chain', 'Create BrowserProvider', 'Initialize contract', 'Ready']} />
          <FlowCard title="Authentication" color="accent" steps={['Login / Sign-up form', 'Email verification', 'Session created (JWT)', 'Load user profile', 'Log activity', 'App access']} />
        </div>
      </Section>

      {/* ── 5. Tech Stack ──────────────────────────────────────────── */}
      <Section title="Technology Stack">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { layer: 'Frontend', tech: 'React 18, TypeScript, Vite, Tailwind, shadcn/ui', color: 'primary' as const },
            { layer: 'State', tech: 'TanStack Query, React Context', color: 'primary' as const },
            { layer: 'Blockchain', tech: 'ethers.js v6, MetaMask, Solidity 0.8.28', color: 'warning' as const },
            { layer: 'Network', tech: 'Ethereum Sepolia Testnet', color: 'warning' as const },
            { layer: 'Backend', tech: 'Lovable Cloud (PostgreSQL + Auth + RLS)', color: 'accent' as const },
            { layer: 'Charts', tech: 'Recharts', color: 'accent' as const },
          ].map((t) => (
            <div key={t.layer} className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/30 px-3 py-2">
              <Badge variant="outline" className={`text-[10px] border-${t.color}/40 text-${t.color} shrink-0`}>{t.layer}</Badge>
              <span className="text-xs text-muted-foreground">{t.tech}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Helper: Schema table card ────────────────────────────────────────
function SchemaCard({ name, fields, color }: { name: string; fields: string[]; color: 'primary' | 'accent' | 'warning' | 'destructive' }) {
  const borderColors = {
    primary: 'border-primary/30', accent: 'border-accent/30', 
    warning: 'border-warning/30', destructive: 'border-destructive/30',
  };
  const textColors = {
    primary: 'text-primary', accent: 'text-accent', 
    warning: 'text-warning', destructive: 'text-destructive',
  };

  return (
    <div className={`rounded-lg border ${borderColors[color]} bg-secondary/20 p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <Database className={`h-3.5 w-3.5 ${textColors[color]}`} />
        <span className={`text-xs font-bold font-mono ${textColors[color]}`}>{name}</span>
      </div>
      <div className="space-y-0.5">
        {fields.map((f) => (
          <p key={f} className="text-[10px] font-mono text-muted-foreground pl-5">{f}</p>
        ))}
      </div>
    </div>
  );
}

// ─── Helper: Flow summary card ────────────────────────────────────────
function FlowCard({ title, steps, color }: { title: string; steps: string[]; color: 'primary' | 'accent' | 'warning' }) {
  const borderColors = { primary: 'border-primary/30', accent: 'border-accent/30', warning: 'border-warning/30' };
  const dotColors = { primary: 'bg-primary', accent: 'bg-accent', warning: 'bg-warning' };
  const textColors = { primary: 'text-primary', accent: 'text-accent', warning: 'text-warning' };

  return (
    <div className={`rounded-lg border ${borderColors[color]} bg-secondary/20 p-3`}>
      <p className={`text-xs font-bold mb-2 ${textColors[color]}`}>{title}</p>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${dotColors[color]} shrink-0`} />
            <span className="text-[11px] text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArchitectureView;
