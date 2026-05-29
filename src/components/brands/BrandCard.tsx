import { Brand, BrandAccount } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlatformIcon } from '@/components/posts/PlatformIcon';
import { MoreHorizontal, Users, FileText, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BrandCardProps {
  brand: Brand;
  accounts?: BrandAccount[];
  postCount?: number;
  memberCount?: number;
  onEdit?: (brand: Brand) => void;
  onArchive?: (brandId: string) => void;
  onManageAccounts?: (brand: Brand) => void;
}

export function BrandCard({ brand, accounts = [], postCount = 0, memberCount = 0, onEdit, onArchive, onManageAccounts }: BrandCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-cover rounded-xl" />
            ) : (
              brand.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">{brand.name}</h3>
              {brand.is_archived && <Badge variant="secondary">Archived</Badge>}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {postCount} posts
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {memberCount} members
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(brand)}>Edit Brand</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageAccounts?.(brand)}>Manage Accounts</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onArchive?.(brand.id)} className="text-destructive">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Connected:</span>
          <div className="flex gap-1">
            {accounts.filter(a => a.is_connected).map((account) => (
              <PlatformIcon key={account.id} platform={account.platform} size="sm" />
            ))}
            {accounts.filter(a => a.is_connected).length === 0 && (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}