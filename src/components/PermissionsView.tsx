import { Button } from './ui/button';
import { Shield, Eye, Edit, UserPlus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/hooks/useData';

export function PermissionsView() {
  const { devices, nodes } = useData();

  const adminDevices = devices.filter(d => d.permission === 'admin');
  const writeDevices = devices.filter(d => d.permission === 'write');
  const readDevices = devices.filter(d => d.permission === 'read');
  const validatorNodes = nodes.filter(n => n.role === 'validator');

  const permissions = [
    {
      role: 'Admin',
      description: 'Full access to all features',
      icon: Shield,
      color: 'warning',
      entities: adminDevices.length + validatorNodes.length,
    },
    {
      role: 'Write',
      description: 'Can submit transactions',
      icon: Edit,
      color: 'accent',
      entities: writeDevices.length,
    },
    {
      role: 'Read',
      description: 'View-only access',
      icon: Eye,
      color: 'primary',
      entities: readDevices.length + nodes.filter(n => n.role === 'observer').length,
    },
  ];

  const hasData = devices.length > 0 || nodes.length > 0;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Permission Management</h2>
          <p className="text-sm text-muted-foreground">
            Control access levels for nodes and devices
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="default" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Permission
          </Button>
        </div>
      </div>

      {/* Permission Roles */}
      <div className="grid md:grid-cols-3 gap-4">
        {permissions.map((perm) => {
          const Icon = perm.icon;
          return (
            <div 
              key={perm.role}
              className="rounded-lg border border-border bg-card p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  perm.color === 'warning' && "bg-warning/20",
                  perm.color === 'accent' && "bg-accent/20",
                  perm.color === 'primary' && "bg-primary/20"
                )}>
                  <Icon className={cn(
                    "h-5 w-5",
                    perm.color === 'warning' && "text-warning",
                    perm.color === 'accent' && "text-accent",
                    perm.color === 'primary' && "text-primary"
                  )} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{perm.role}</h3>
                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Entities</span>
                <span className="font-mono text-foreground">{perm.entities}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground">Entity Permissions</h3>
        </div>
        <div className="divide-y divide-border">
          {!hasData ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No devices or nodes registered yet.</p>
              <p className="text-sm mt-1">Connect your wallet and register devices to see permissions.</p>
            </div>
          ) : (
            <>
              {devices.slice(0, 4).map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-mono text-primary">IOT</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.id}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-mono uppercase",
                    device.permission === 'admin' && "bg-warning/20 text-warning",
                    device.permission === 'write' && "bg-accent/20 text-accent",
                    device.permission === 'read' && "bg-primary/20 text-primary"
                  )}>
                    {device.permission}
                  </div>
                </div>
              ))}
              {nodes.slice(0, 2).map((node) => (
                <div key={node.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                      <span className="text-xs font-mono text-accent">NODE</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{node.name}</p>
                      <p className="text-xs text-muted-foreground">{node.address}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-mono uppercase",
                    node.role === 'validator' ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
                  )}>
                    {node.role}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
