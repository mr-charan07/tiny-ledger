import { memo } from 'react';
import { IoTDevice } from '@/types/blockchain';
import { formatDistanceToNow } from 'date-fns';
import { Cpu, Thermometer, Radio, Router, Shield, Eye, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceCardProps {
  device: IoTDevice;
}

export const DeviceCard = memo(function DeviceCard({ device }: DeviceCardProps) {
  const typeConfig = {
    sensor: {
      icon: Thermometer,
      color: 'text-primary',
      bg: 'bg-primary/20',
    },
    actuator: {
      icon: Radio,
      color: 'text-accent',
      bg: 'bg-accent/20',
    },
    gateway: {
      icon: Router,
      color: 'text-warning',
      bg: 'bg-warning/20',
    },
  };

  const statusConfig = {
    online: {
      color: 'bg-accent',
      label: 'Online',
    },
    offline: {
      color: 'bg-destructive',
      label: 'Offline',
    },
    warning: {
      color: 'bg-warning',
      label: 'Warning',
    },
  };

  const permissionConfig = {
    read: { icon: Eye, label: 'Read' },
    write: { icon: Edit, label: 'Write' },
    admin: { icon: Shield, label: 'Admin' },
  };

  const typeInfo = typeConfig[device.type];
  const statusInfo = statusConfig[device.status];
  const permInfo = permissionConfig[device.permission];
  const TypeIcon = typeInfo.icon;
  const PermIcon = permInfo.icon;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50",
      device.status === 'online' && "border-accent/20"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", typeInfo.bg)}>
            <TypeIcon className={cn("h-5 w-5", typeInfo.color)} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{device.name}</p>
            <p className="text-xs font-mono text-muted-foreground">
              {device.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={cn("h-2 w-2 rounded-full animate-pulse", statusInfo.color)} />
          <span className="text-xs text-muted-foreground">{statusInfo.label}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Type</span>
          <span className="font-mono text-xs uppercase text-foreground">
            {device.type}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Permission</span>
          <span className={cn(
            "flex items-center gap-1 font-mono text-xs uppercase px-2 py-0.5 rounded",
            device.permission === 'admin' ? 'bg-warning/20 text-warning' : 
            device.permission === 'write' ? 'bg-accent/20 text-accent' : 
            'bg-secondary text-secondary-foreground'
          )}>
            <PermIcon className="h-3 w-3" />
            {permInfo.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Transactions</span>
          <span className="font-mono text-foreground">{device.transactionCount.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Last reading</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(device.lastReading, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
});
