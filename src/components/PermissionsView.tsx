import { useState, memo, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Shield,
  Eye,
  Edit,
  Settings,
  Search,
  MoreVertical,
  Power,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/hooks/useData';
import { usePermissions, type PermissionLevel } from '@/hooks/usePermissions';
import { PermissionEditDialog } from './PermissionEditDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { IoTDevice, Node } from '@/types/blockchain';

interface PermissionsViewProps {
  onShowAuth?: () => void;
}

export const PermissionsView = memo(function PermissionsView({ onShowAuth }: PermissionsViewProps) {
  const { devices, nodes, fetchData, isAuthenticated, isLoading } = useData();
  const {
    isUpdating,
    updateDevicePermission,
    updateNodeRole,
    toggleDeviceStatus,
    toggleNodeStatus,
    deleteDevice,
    deleteNode,
  } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPermission, setFilterPermission] = useState<string>('all');
  const [editEntity, setEditEntity] = useState<IoTDevice | Node | null>(null);
  const [editType, setEditType] = useState<'device' | 'node'>('device');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPermission =
      filterPermission === 'all' || device.permission === filterPermission;
    return matchesSearch && matchesPermission;
  });

  // Filter nodes
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      filterPermission === 'all' ||
      (filterPermission === 'admin' && node.role === 'validator') ||
      (filterPermission === 'read' && node.role === 'observer');
    return matchesSearch && matchesRole;
  });

  const adminDevices = devices.filter((d) => d.permission === 'admin');
  const writeDevices = devices.filter((d) => d.permission === 'write');
  const readDevices = devices.filter((d) => d.permission === 'read');
  const validatorNodes = nodes.filter((n) => n.role === 'validator');

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
      entities: readDevices.length + nodes.filter((n) => n.role === 'observer').length,
    },
  ];

  const handleEditDevice = useCallback((device: IoTDevice) => {
    setEditEntity(device);
    setEditType('device');
    setIsDialogOpen(true);
  }, []);

  const handleEditNode = useCallback((node: Node) => {
    setEditEntity(node);
    setEditType('node');
    setIsDialogOpen(true);
  }, []);

  const handleQuickPermissionChange = useCallback(
    async (deviceId: string, permission: PermissionLevel) => {
      await updateDevicePermission(deviceId, permission);
      fetchData();
    },
    [updateDevicePermission, fetchData]
  );

  const handleQuickRoleChange = useCallback(
    async (nodeId: string, isValidator: boolean) => {
      await updateNodeRole(nodeId, isValidator);
      fetchData();
    },
    [updateNodeRole, fetchData]
  );

  const handleQuickToggleDevice = useCallback(
    async (deviceId: string, currentActive: boolean) => {
      await toggleDeviceStatus(deviceId, currentActive);
      fetchData();
    },
    [toggleDeviceStatus, fetchData]
  );

  const handleQuickToggleNode = useCallback(
    async (nodeId: string, currentActive: boolean) => {
      await toggleNodeStatus(nodeId, currentActive);
      fetchData();
    },
    [toggleNodeStatus, fetchData]
  );

  const handleQuickDeleteDevice = useCallback(
    async (deviceId: string) => {
      await deleteDevice(deviceId);
      fetchData();
    },
    [deleteDevice, fetchData]
  );

  const handleQuickDeleteNode = useCallback(
    async (nodeId: string) => {
      await deleteNode(nodeId);
      fetchData();
    },
    [deleteNode, fetchData]
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Sign In Required</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Please sign in to manage permissions for your devices and nodes.
        </p>
        <Button onClick={onShowAuth}>Sign In</Button>
      </div>
    );
  }

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={isLoading || isUpdating}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Permission Roles Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {permissions.map((perm) => {
          const Icon = perm.icon;
          return (
            <div
              key={perm.role}
              className="rounded-lg border border-border bg-card p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    perm.color === 'warning' && 'bg-warning/20',
                    perm.color === 'accent' && 'bg-accent/20',
                    perm.color === 'primary' && 'bg-primary/20'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      perm.color === 'warning' && 'text-warning',
                      perm.color === 'accent' && 'text-accent',
                      perm.color === 'primary' && 'text-primary'
                    )}
                  />
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterPermission} onValueChange={setFilterPermission}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by permission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Permissions</SelectItem>
            <SelectItem value="admin">Admin Only</SelectItem>
            <SelectItem value="write">Write Only</SelectItem>
            <SelectItem value="read">Read Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entity Tabs */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices ({filteredDevices.length})</TabsTrigger>
          <TabsTrigger value="nodes">Nodes ({filteredNodes.length})</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground">Device Permissions</h3>
            </div>
            <div className="divide-y divide-border">
              {!hasData ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No devices registered yet.</p>
                  <p className="text-sm mt-1">
                    Connect your wallet and register devices to manage permissions.
                  </p>
                </div>
              ) : filteredDevices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No devices match your filter criteria.</p>
                </div>
              ) : (
                filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-mono text-primary">IOT</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{device.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {device.address || device.id}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              'inline-flex h-2 w-2 rounded-full',
                              device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                            )}
                          />
                          <span className="text-xs text-muted-foreground capitalize">
                            {device.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Select
                        value={device.permission}
                        onValueChange={(value) =>
                          handleQuickPermissionChange(device.id, value as PermissionLevel)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">
                            <div className="flex items-center gap-2">
                              <Eye className="h-3 w-3" />
                              Read
                            </div>
                          </SelectItem>
                          <SelectItem value="write">
                            <div className="flex items-center gap-2">
                              <Edit className="h-3 w-3" />
                              Write
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isUpdating}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditDevice(device)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleQuickToggleDevice(device.id, device.status === 'online')
                            }
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {device.status === 'online' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleQuickDeleteDevice(device.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Nodes Tab */}
        <TabsContent value="nodes">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground">Node Permissions</h3>
            </div>
            <div className="divide-y divide-border">
              {nodes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No nodes registered yet.</p>
                  <p className="text-sm mt-1">
                    Connect your wallet and register nodes to manage permissions.
                  </p>
                </div>
              ) : filteredNodes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No nodes match your filter criteria.</p>
                </div>
              ) : (
                filteredNodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-mono text-accent">NODE</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{node.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{node.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              'inline-flex h-2 w-2 rounded-full',
                              node.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            )}
                          />
                          <span className="text-xs text-muted-foreground capitalize">
                            {node.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Select
                        value={node.role}
                        onValueChange={(value) =>
                          handleQuickRoleChange(node.id, value === 'validator')
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="observer">
                            <div className="flex items-center gap-2">
                              <Eye className="h-3 w-3" />
                              Observer
                            </div>
                          </SelectItem>
                          <SelectItem value="validator">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              Validator
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isUpdating}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditNode(node)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleQuickToggleNode(node.id, node.status === 'active')
                            }
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {node.status === 'active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleQuickDeleteNode(node.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <PermissionEditDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entity={editEntity}
        entityType={editType}
        onUpdatePermission={updateDevicePermission}
        onUpdateRole={updateNodeRole}
        onToggleStatus={editType === 'device' ? toggleDeviceStatus : toggleNodeStatus}
        onDelete={editType === 'device' ? deleteDevice : deleteNode}
        onSuccess={fetchData}
      />
    </div>
  );
});
