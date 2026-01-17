import { memo } from 'react';
import { Node } from '@/types/blockchain';
import { formatDistanceToNow } from 'date-fns';
import { Server, Shield, Eye, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeCardProps {
  node: Node;
}

export const NodeCard = memo(function NodeCard({ node }: NodeCardProps) {
  const statusConfig = {
    active: {
      color: 'text-accent',
      bg: 'bg-accent/20',
      icon: Wifi,
      label: 'Active',
    },
    inactive: {
      color: 'text-destructive',
      bg: 'bg-destructive/20',
      icon: WifiOff,
      label: 'Offline',
    },
    syncing: {
      color: 'text-warning',
      bg: 'bg-warning/20',
      icon: RefreshCw,
      label: 'Syncing',
    },
  };

  const config = statusConfig[node.status];
  const StatusIcon = config.icon;
  const RoleIcon = node.role === 'validator' ? Shield : Eye;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50",
      node.status === 'active' && "border-accent/30"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{node.name}</p>
            <p className="text-xs font-mono text-muted-foreground">
              {node.address}
            </p>
          </div>
        </div>

        <div className={cn("p-1.5 rounded-full", config.bg)}>
          <StatusIcon className={cn("h-4 w-4", config.color, node.status === 'syncing' && "animate-spin")} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <RoleIcon className="h-3 w-3" />
            Role
          </span>
          <span className={cn(
            "font-mono text-xs uppercase px-2 py-0.5 rounded",
            node.role === 'validator' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'
          )}>
            {node.role}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Blocks Validated</span>
          <span className="font-mono text-foreground">{node.blocksValidated}</span>
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Last seen</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(node.lastSeen, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
});
