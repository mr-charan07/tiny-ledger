import { Block } from '@/types/blockchain';
import { formatDistanceToNow } from 'date-fns';
import { Box, Clock, Hash, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockCardProps {
  block: Block;
  isLatest?: boolean;
}

export function BlockCard({ block, isLatest }: BlockCardProps) {
  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50",
      isLatest && "border-primary/50 animate-glow"
    )}>
      {isLatest && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/20 text-primary text-xs font-mono rounded uppercase">
          Latest
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Box className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-primary">
            #{block.index}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(block.timestamp, { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Hash:</span>
          <code className="font-mono text-xs text-foreground truncate">
            {truncateHash(block.hash)}
          </code>
        </div>
        
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Validator:</span>
          <span className="font-mono text-xs text-accent">
            {block.validator}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {block.data.length} transaction{block.data.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            Nonce: {block.nonce}
          </span>
        </div>
      </div>
    </div>
  );
}
