import { Post, PostStatus } from '@/types/database';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PlatformIcon } from '@/components/posts/PlatformIcon';
import { format } from 'date-fns';
import { MoreHorizontal, Clock, Calendar, ArrowRight, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  onStatusChange?: (postId: string, status: PostStatus) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  showActions?: boolean;
}

const statusConfig: Record<PostStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_manager: { label: 'Pending Manager', variant: 'outline' },
  pending_client: { label: 'Pending Client', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  scheduled: { label: 'Scheduled', variant: 'default' },
  published: { label: 'Published', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

export function PostCard({ post, onStatusChange, onEdit, onDelete, showActions = true }: PostCardProps) {
  const config = statusConfig[post.status];

  const getNextStatus = (current: PostStatus): PostStatus | null => {
    const flow: Record<PostStatus, PostStatus | null> = {
      draft: 'pending_manager',
      pending_manager: 'pending_client',
      pending_client: 'approved',
      approved: 'scheduled',
      scheduled: 'published',
      published: null,
      rejected: 'draft',
    };
    return flow[current];
  };

  const nextStatus = getNextStatus(post.status);

  return (
    <Card className="group hover:shadow-md transition-shadow animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {post.platforms.map((platform) => (
              <PlatformIcon key={platform} platform={platform} size="sm" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} className="font-medium">
              {config.label}
            </Badge>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(post)}>Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete?.(post.id)} className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {post.media_urls.slice(0, 3).map((url, i) => (
              <div key={i} className="h-20 w-20 shrink-0 rounded-lg bg-muted overflow-hidden">
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
        {post.scheduled_for && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Scheduled for {format(new Date(post.scheduled_for), 'MMM d, yyyy h:mm a')}</span>
          </div>
        )}
      </CardContent>
      {showActions && nextStatus && post.status !== 'published' && (
        <CardFooter className="pt-0">
          <div className="flex gap-2 w-full">
            {post.status !== 'draft' && post.status !== 'rejected' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={() => onStatusChange?.(post.id, 'rejected')}
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>
            )}
            <Button 
              size="sm" 
              className="gap-1 ml-auto"
              onClick={() => onStatusChange?.(post.id, nextStatus)}
            >
              {nextStatus === 'pending_manager' && 'Submit for Review'}
              {nextStatus === 'pending_client' && 'Send to Client'}
              {nextStatus === 'approved' && 'Approve'}
              {nextStatus === 'scheduled' && 'Schedule'}
              {nextStatus === 'published' && 'Publish Now'}
              {nextStatus === 'draft' && 'Revise'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}