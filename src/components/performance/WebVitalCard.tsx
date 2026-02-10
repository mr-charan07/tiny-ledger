import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface WebVitalCardProps {
  name: string;
  fullName: string;
  value: number | null;
  unit: string;
  thresholds: { good: number; needsImprovement: number };
  placeholder: string;
}

export function WebVitalCard({ name, fullName, value, unit, thresholds, placeholder }: WebVitalCardProps) {
  const getStatus = () => {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const status = getStatus();

  const getProgressValue = () => {
    if (value === null) return 0;
    const max = thresholds.needsImprovement * 1.5;
    return Math.min((value / max) * 100, 100);
  };

  const statusConfig = {
    good: {
      color: 'text-accent',
      bg: 'bg-accent/10 border-accent/30',
      dot: 'bg-accent',
      label: 'GOOD',
      progressClass: '[&>div]:bg-accent',
    },
    'needs-improvement': {
      color: 'text-warning',
      bg: 'bg-warning/10 border-warning/30',
      dot: 'bg-warning',
      label: 'NEEDS WORK',
      progressClass: '[&>div]:bg-warning',
    },
    poor: {
      color: 'text-destructive',
      bg: 'bg-destructive/10 border-destructive/30',
      dot: 'bg-destructive',
      label: 'POOR',
      progressClass: '[&>div]:bg-destructive',
    },
    unknown: {
      color: 'text-muted-foreground',
      bg: 'bg-muted/30 border-border',
      dot: 'bg-muted-foreground',
      label: 'MEASURING',
      progressClass: '[&>div]:bg-muted-foreground',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.01]",
      config.bg
    )}>
      {/* Status indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full animate-pulse", config.dot)} />
          <span className="text-base font-bold font-mono tracking-wide">{name}</span>
        </div>
        <span className={cn(
          "text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border",
          config.color,
          "border-current/20 bg-current/5"
        )}>
          {config.label}
        </span>
      </div>

      {/* Value */}
      <div className={cn("text-3xl font-bold font-mono mb-1", config.color)}>
        {value !== null ? (
          <>
            {unit === '' ? value.toFixed(3) : value.toFixed(0)}
            {unit && <span className="text-base font-normal ml-1 text-muted-foreground">{unit}</span>}
          </>
        ) : (
          <span className="text-lg text-muted-foreground animate-pulse">{placeholder}</span>
        )}
      </div>

      {/* Progress bar */}
      <Progress 
        value={getProgressValue()} 
        className={cn("h-1.5 mt-3 bg-muted/30", config.progressClass)} 
      />

      {/* Threshold labels */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-muted-foreground font-mono">{fullName}</p>
        <p className="text-[10px] text-muted-foreground font-mono">
          Good: ≤{thresholds.good}{unit}
        </p>
      </div>
    </div>
  );
}