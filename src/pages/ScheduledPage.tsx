import { AppLayout } from '@/components/layout/AppLayout';
import { PostList } from '@/components/posts/PostList';
import { usePosts } from '@/hooks/usePosts';

export default function ScheduledPage() {
  const { posts, loading, updatePostStatus, deletePost } = usePosts(['scheduled', 'approved']);

  return (
    <AppLayout title="Scheduled">
      <PostList
        posts={posts}
        loading={loading}
        onStatusChange={updatePostStatus}
        onDelete={deletePost}
        emptyMessage="No scheduled posts"
      />
    </AppLayout>
  );
}