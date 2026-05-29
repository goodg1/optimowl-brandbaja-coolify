import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole, AppRole } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  profile: Profile;
  role: AppRole;
}

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeam = useCallback(async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const membersList: TeamMember[] = (profiles || []).map((profile: Profile) => {
        const userRole = (roles || []).find((r: UserRole) => r.user_id === profile.id);
        return {
          profile,
          role: userRole?.role || 'creator'
        };
      });

      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const updateMemberRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: 'Role updated', description: `User role changed to ${newRole}.` });
      await fetchTeam();
      return true;
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: 'Error', description: 'Failed to update role.', variant: 'destructive' });
      return false;
    }
  };

  return { members, loading, fetchTeam, updateMemberRole };
}