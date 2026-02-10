import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PerformanceStatCardProps {
  title: string;
  value: string | number;
  unit: string;
  subtitle?: string;
  icon: LucideIcon;
  trendIcon: LucideIcon;
  trendColor: string;
  trendLabel: string;
  accentClass: string;
  glowClass?: string;
}

export function PerformanceStatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trendIcon: TrendIcon,
  trendColor,
  trendLabel,
  accentClass,
  glowClass,
}: PerformanceStatCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border transition-all duration-300 hover:scale-[1.02]",
      accentClass,
      glowClass
    )}>
      {/* Animated background shimmer */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-pulse-slow" />
      </div>
      
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-background/50 backdrop-blur-sm">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">{title}</span>
          </span>
          <TrendIcon className={cn("h-4 w-4", trendColor)} />
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
          {value}
          <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground font-mono">{subtitle}</p>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] uppercase tracking-wider font-mono",
              trendColor,
              "border-current/30"
            )}
          >
            {trendLabel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}