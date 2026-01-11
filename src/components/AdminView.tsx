import { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Shield, ShieldAlert, ShieldCheck, User, UserX, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AdminViewProps {
  onShowAuth?: () => void;
}

export function AdminView({ onShowAuth }: AdminViewProps) {
  const { isAdmin, isLoading, users, fetchUsers, toggleUserStatus, assignRole, removeRole } = useAdmin();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    action: 'deactivate' | 'activate' | 'remove-role';
    userName: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-slide-in">
        <div className="p-6 rounded-full bg-destructive/20">
          <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            You don't have administrator privileges to access this section.
          </p>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary/20 text-primary border-primary/30"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-warning/20 text-warning border-warning/30"><Shield className="h-3 w-3 mr-1" />Moderator</Badge>;
      case 'user':
        return <Badge className="bg-muted text-muted-foreground"><User className="h-3 w-3 mr-1" />User</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">No Role</Badge>;
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.action === 'deactivate' || confirmDialog.action === 'activate') {
      await toggleUserStatus(confirmDialog.userId, confirmDialog.action === 'deactivate');
    } else if (confirmDialog.action === 'remove-role') {
      await removeRole(confirmDialog.userId);
    }

    setConfirmDialog(null);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and access permissions
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Users</p>
          <p className="text-2xl font-bold text-accent">{users.filter(u => u.is_active).length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold text-primary">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Deactivated</p>
          <p className="text-2xl font-bold text-destructive">{users.filter(u => !u.is_active).length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-accent' : 'bg-destructive'}`} />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge className="bg-accent/20 text-accent border-accent/30">Active</Badge>
                    ) : (
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30">Deactivated</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.last_login_at ? format(new Date(user.last_login_at), 'MMM d, yyyy HH:mm') : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={user.role || 'none'}
                        onValueChange={(value) => {
                          if (value === 'none') {
                            setConfirmDialog({
                              open: true,
                              userId: user.user_id,
                              action: 'remove-role',
                              userName: user.email,
                            });
                          } else {
                            assignRole(user.user_id, value as 'admin' | 'moderator' | 'user');
                          }
                        }}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue placeholder="Set Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="none">Remove Role</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant={user.is_active ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setConfirmDialog({
                          open: true,
                          userId: user.user_id,
                          action: user.is_active ? 'deactivate' : 'activate',
                          userName: user.email,
                        })}
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="h-3 w-3 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog?.open || false} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === 'deactivate' && 'Deactivate User'}
              {confirmDialog?.action === 'activate' && 'Activate User'}
              {confirmDialog?.action === 'remove-role' && 'Remove Role'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === 'deactivate' && (
                <>Are you sure you want to deactivate <strong>{confirmDialog?.userName}</strong>? They will not be able to access the system.</>
              )}
              {confirmDialog?.action === 'activate' && (
                <>Are you sure you want to activate <strong>{confirmDialog?.userName}</strong>? They will regain access to the system.</>
              )}
              {confirmDialog?.action === 'remove-role' && (
                <>Are you sure you want to remove the role from <strong>{confirmDialog?.userName}</strong>?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog?.action === 'deactivate' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
