import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyChartStateProps {
  message?: string;
  className?: string;
}

export function EmptyChartState({ message = 'No data available', className }: EmptyChartStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center h-full gap-3",
      className
    )}>
      <div className="p-3 rounded-xl bg-muted/30 border border-border">
        <BarChart3 className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground font-mono">{message}</p>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-muted-foreground/20 rounded-full"
            style={{ height: `${12 + Math.random() * 20}px` }}
          />
        ))}
      </div>
    </div>
  );
}