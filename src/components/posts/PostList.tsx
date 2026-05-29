import { Post, PostStatus } from '@/types/database';
import { PostCard } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';

interface PostListProps {
  posts: Post[];
  loading?: boolean;
  onStatusChange?: (postId: string, status: PostStatus) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  emptyMessage?: string;
  showActions?: boolean;
}

export function PostList({ posts, loading, onStatusChange, onEdit, onDelete, emptyMessage = 'No posts found', showActions = true }: PostListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 p-4 border rounded-lg">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
}