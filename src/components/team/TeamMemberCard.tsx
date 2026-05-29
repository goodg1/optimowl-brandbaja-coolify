import { Profile, AppRole } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
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

interface TeamMemberCardProps {
  profile: Profile;
  role: AppRole;
  onRoleChange?: (userId: string, newRole: AppRole) => void;
  canManage?: boolean;
}

const roleColors: Record<AppRole, string> = {
  admin: 'bg-primary text-primary-foreground',
  manager: 'bg-accent text-accent-foreground',
  creator: 'bg-secondary text-secondary-foreground',
  client: 'bg-muted text-muted-foreground',
};

export function TeamMemberCard({ profile, role, onRoleChange, canManage }: TeamMemberCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {profile.full_name?.charAt(0).toUpperCase() || profile.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">
                {profile.full_name || profile.email.split('@')[0]}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
          </div>
          {canManage ? (
            <Select
              value={role}
              onValueChange={(value: AppRole) => onRoleChange?.(profile.id, value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge className={roleColors[role]}>{role}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}