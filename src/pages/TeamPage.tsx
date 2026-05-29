import { AppLayout } from '@/components/layout/AppLayout';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/contexts/AuthContext';

export default function TeamPage() {
  const { members, loading, updateMemberRole } = useTeam();
  const { role } = useAuth();
  const canManage = role === 'admin';

  return (
    <AppLayout title="Team">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <TeamMemberCard
            key={member.profile.id}
            profile={member.profile}
            role={member.role}
            onRoleChange={updateMemberRole}
            canManage={canManage}
          />
        ))}
      </div>
      {members.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">No team members yet</div>
      )}
    </AppLayout>
  );
}