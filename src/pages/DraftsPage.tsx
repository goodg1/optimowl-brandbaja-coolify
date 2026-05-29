import { AppLayout } from '@/components/layout/AppLayout';
import { PostList } from '@/components/posts/PostList';
import { usePosts } from '@/hooks/usePosts';

export default function DraftsPage() {
  const { posts, loading, updatePostStatus, deletePost } = usePosts(['draft']);

  return (
    <AppLayout title="Drafts">
      <PostList
        posts={posts}
        loading={loading}
        onStatusChange={updatePostStatus}
        onDelete={deletePost}
        emptyMessage="No drafts yet. Create your first post!"
      />
    </AppLayout>
  );
}