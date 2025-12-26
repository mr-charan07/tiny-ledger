import { Block } from '@/types/blockchain';
import { cn } from '@/lib/utils';

interface BlockchainVisualizerProps {
  blocks: Block[];
}

export function BlockchainVisualizer({ blocks }: BlockchainVisualizerProps) {
  return (
    <div className="relative overflow-x-auto py-4">
      <div className="flex items-center gap-2 min-w-max px-4">
        {blocks.slice(0, 6).map((block, index) => (
          <div key={block.id} className="flex items-center">
            <div className={cn(
              "relative w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105",
              index === 0 
                ? "border-primary bg-primary/10 animate-glow" 
                : "border-border bg-card hover:border-primary/50"
            )}>
              <span className={cn(
                "font-mono text-lg font-bold",
                index === 0 ? "text-primary text-glow-primary" : "text-foreground"
              )}>
                #{block.index}
              </span>
              <span className="text-xs text-muted-foreground">
                {block.data.length} tx
              </span>
              
              {index === 0 && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            
            {index < blocks.length - 1 && index < 5 && (
              <div className="flex items-center px-1">
                <div className="h-0.5 w-4 bg-gradient-to-r from-primary/50 to-border" />
                <div className="h-2 w-2 rounded-full border border-border bg-secondary" />
                <div className="h-0.5 w-4 bg-gradient-to-r from-border to-primary/20" />
              </div>
            )}
          </div>
        ))}
        
        <div className="flex items-center gap-1 ml-2 text-muted-foreground">
          <span className="text-xs">...</span>
          <span className="font-mono text-xs">{blocks[0]?.index - 5 || 0} more</span>
        </div>
      </div>
    </div>
  );
}
