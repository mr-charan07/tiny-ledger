import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PermissionLevel = 'read' | 'write' | 'admin';
export type NodeRole = 'validator' | 'observer';

const permissionToLevel: Record<PermissionLevel, number> = {
  read: 0,
  write: 1,
  admin: 2,
};

const levelToPermission: Record<number, PermissionLevel> = {
  0: 'read',
  1: 'write',
  2: 'admin',
};

export function usePermissions() {
  const [isUpdating, setIsUpdating] = useState(false);

  // Update device permission
  const updateDevicePermission = useCallback(
    async (deviceId: string, permission: PermissionLevel): Promise<boolean> => {
      setIsUpdating(true);
      try {
        const { error } = await supabase
          .from('devices')
          .update({ permission_level: permissionToLevel[permission] })
          .eq('id', deviceId);

        if (error) throw error;
        toast.success(`Device permission updated to ${permission}`);
        return true;
      } catch (error) {
        console.error('Error updating device permission:', error);
        toast.error('Failed to update device permission');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Update node role
  const updateNodeRole = useCallback(
    async (nodeId: string, isValidator: boolean): Promise<boolean> => {
      setIsUpdating(true);
      try {
        const { error } = await supabase
          .from('nodes')
          .update({ is_validator: isValidator })
          .eq('id', nodeId);

        if (error) throw error;
        toast.success(`Node role updated to ${isValidator ? 'validator' : 'observer'}`);
        return true;
      } catch (error) {
        console.error('Error updating node role:', error);
        toast.error('Failed to update node role');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Toggle device active status
  const toggleDeviceStatus = useCallback(
    async (deviceId: string, currentActive: boolean): Promise<boolean> => {
      setIsUpdating(true);
      try {
        const { error } = await supabase
          .from('devices')
          .update({ active: !currentActive })
          .eq('id', deviceId);

        if (error) throw error;
        toast.success(`Device ${currentActive ? 'deactivated' : 'activated'}`);
        return true;
      } catch (error) {
        console.error('Error toggling device status:', error);
        toast.error('Failed to update device status');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Toggle node active status
  const toggleNodeStatus = useCallback(
    async (nodeId: string, currentActive: boolean): Promise<boolean> => {
      setIsUpdating(true);
      try {
        const { error } = await supabase
          .from('nodes')
          .update({ active: !currentActive })
          .eq('id', nodeId);

        if (error) throw error;
        toast.success(`Node ${currentActive ? 'deactivated' : 'activated'}`);
        return true;
      } catch (error) {
        console.error('Error toggling node status:', error);
        toast.error('Failed to update node status');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Delete device
  const deleteDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('devices').delete().eq('id', deviceId);

      if (error) throw error;
      toast.success('Device deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Delete node
  const deleteNode = useCallback(async (nodeId: string): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('nodes').delete().eq('id', nodeId);

      if (error) throw error;
      toast.success('Node deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting node:', error);
      toast.error('Failed to delete node');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    isUpdating,
    updateDevicePermission,
    updateNodeRole,
    toggleDeviceStatus,
    toggleNodeStatus,
    deleteDevice,
    deleteNode,
    permissionToLevel,
    levelToPermission,
  };
}
