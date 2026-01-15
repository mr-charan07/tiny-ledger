import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  role: 'admin' | 'moderator' | 'user' | null;
}

interface LoginActivity {
  id: string;
  user_id: string;
  email: string;
  action: 'login' | 'logout';
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const { toast } = useToast();

  // Check if current user is admin
  const checkAdminStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all users (admin only)
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      // Get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserProfile[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          display_name: profile.display_name,
          is_active: profile.is_active,
          last_login_at: profile.last_login_at,
          created_at: profile.created_at,
          role: userRole?.role || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    }
  }, [isAdmin, toast]);

  // Fetch all login activity (admin only)
  const fetchLoginActivity = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from('login_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLoginActivity((data || []) as LoginActivity[]);
    } catch (error) {
      console.error('Error fetching login activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch login activity',
        variant: 'destructive',
      });
    }
  }, [isAdmin, toast]);

  // Toggle user active status
  const toggleUserStatus = useCallback(async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !isActive })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${isActive ? 'deactivated' : 'activated'} successfully`,
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  }, [fetchUsers, toast]);

  // Assign role to user
  const assignRole = useCallback(async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    try {
      // First, delete any existing role for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then insert the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Role assigned successfully`,
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
    }
  }, [fetchUsers, toast]);

  // Remove role from user
  const removeRole = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role removed successfully',
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove role',
        variant: 'destructive',
      });
    }
  }, [fetchUsers, toast]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchLoginActivity();
    }
  }, [isAdmin, fetchUsers, fetchLoginActivity]);

  return {
    isAdmin,
    isLoading,
    users,
    loginActivity,
    fetchUsers,
    fetchLoginActivity,
    toggleUserStatus,
    assignRole,
    removeRole,
  };
}
