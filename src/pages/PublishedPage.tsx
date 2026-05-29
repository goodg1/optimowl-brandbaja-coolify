import { AppLayout } from '@/components/layout/AppLayout';
import { PostList } from '@/components/posts/PostList';
import { usePosts } from '@/hooks/usePosts';

export default function PublishedPage() {
  const { posts, loading } = usePosts(['published']);

  return (
    <AppLayout title="Published">
      <PostList posts={posts} loading={loading} showActions={false} emptyMessage="No published posts yet" />
    </AppLayout>
  );
}