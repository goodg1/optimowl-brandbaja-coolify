import { AppLayout } from '@/components/layout/AppLayout';
import { PostList } from '@/components/posts/PostList';
import { usePosts } from '@/hooks/usePosts';

export default function PendingPage() {
  const { posts, loading, updatePostStatus, deletePost } = usePosts(['pending_manager', 'pending_client']);

  return (
    <AppLayout title="Pending Approval">
      <PostList
        posts={posts}
        loading={loading}
        onStatusChange={updatePostStatus}
        onDelete={deletePost}
        emptyMessage="No posts pending approval"
      />
    </AppLayout>
  );
}