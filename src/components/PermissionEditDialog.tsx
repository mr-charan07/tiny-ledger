import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, Eye, Edit, Server, Cpu, Trash2 } from 'lucide-react';
import type { IoTDevice, Node } from '@/types/blockchain';
import type { PermissionLevel } from '@/hooks/usePermissions';

interface PermissionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: IoTDevice | Node | null;
  entityType: 'device' | 'node';
  onUpdatePermission: (id: string, permission: PermissionLevel) => Promise<boolean>;
  onUpdateRole: (id: string, isValidator: boolean) => Promise<boolean>;
  onToggleStatus: (id: string, currentActive: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onSuccess: () => void;
}

export function PermissionEditDialog({
  open,
  onOpenChange,
  entity,
  entityType,
  onUpdatePermission,
  onUpdateRole,
  onToggleStatus,
  onDelete,
  onSuccess,
}: PermissionEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!entity) return null;

  const isDevice = entityType === 'device';
  const device = isDevice ? (entity as IoTDevice) : null;
  const node = !isDevice ? (entity as Node) : null;

  const handlePermissionChange = async (value: string) => {
    setIsLoading(true);
    const success = await onUpdatePermission(entity.id, value as PermissionLevel);
    setIsLoading(false);
    if (success) {
      onSuccess();
      onOpenChange(false);
    }
  };

  const handleRoleChange = async (isValidator: boolean) => {
    setIsLoading(true);
    const success = await onUpdateRole(entity.id, isValidator);
    setIsLoading(false);
    if (success) {
      onSuccess();
      onOpenChange(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsLoading(true);
    const currentActive = isDevice
      ? device?.status === 'online'
      : node?.status === 'active';
    const success = await onToggleStatus(entity.id, currentActive || false);
    setIsLoading(false);
    if (success) {
      onSuccess();
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    const success = await onDelete(entity.id);
    setIsLoading(false);
    if (success) {
      onSuccess();
      onOpenChange(false);
    }
    setShowDeleteConfirm(false);
  };

  const currentActive = isDevice
    ? device?.status === 'online'
    : node?.status === 'active';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDevice ? (
              <Cpu className="h-5 w-5 text-primary" />
            ) : (
              <Server className="h-5 w-5 text-accent" />
            )}
            Edit {isDevice ? 'Device' : 'Node'} Permissions
          </DialogTitle>
          <DialogDescription>
            Manage permissions and status for {entity.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Entity Info */}
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="font-medium text-foreground">{entity.name}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {isDevice ? 'Address' : 'Address'}
            </div>
            <div className="font-mono text-xs text-foreground break-all">
              {isDevice ? device?.address : node?.address}
            </div>
          </div>

          {/* Permission/Role Select */}
          {isDevice ? (
            <div className="space-y-2">
              <Label>Permission Level</Label>
              <Select
                defaultValue={device?.permission}
                onValueChange={handlePermissionChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Read - View-only access
                    </div>
                  </SelectItem>
                  <SelectItem value="write">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-accent" />
                      Write - Can submit transactions
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-warning" />
                      Admin - Full access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Node Role</Label>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <div className="font-medium text-foreground">Validator Node</div>
                  <div className="text-sm text-muted-foreground">
                    Enable to allow this node to validate blocks
                  </div>
                </div>
                <Switch
                  checked={node?.role === 'validator'}
                  onCheckedChange={handleRoleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <div className="font-medium text-foreground">Active Status</div>
              <div className="text-sm text-muted-foreground">
                {currentActive ? 'Currently active' : 'Currently inactive'}
              </div>
            </div>
            <Button
              variant={currentActive ? 'destructive' : 'default'}
              size="sm"
              onClick={handleToggleStatus}
              disabled={isLoading}
            >
              {currentActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>

          {/* Delete Section */}
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {isDevice ? 'Device' : 'Node'}
            </Button>
          ) : (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 space-y-3">
              <p className="text-sm text-destructive">
                Are you sure you want to delete this {isDevice ? 'device' : 'node'}? This action
                cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  Yes, Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
