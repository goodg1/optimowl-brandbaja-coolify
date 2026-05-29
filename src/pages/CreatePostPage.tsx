import { AppLayout } from '@/components/layout/AppLayout';
import { CreatePostForm, PlatformOverride } from '@/components/posts/CreatePostForm';
import { usePosts } from '@/hooks/usePosts';
import { PlatformType } from '@/types/database';

export default function CreatePostPage() {
  const { createPost } = usePosts();

  const handleSubmit = async (
    content: string,
    platforms: PlatformType[],
    scheduledFor?: string,
    extras?: { mediaUrls?: string[]; hashtags?: string[]; overrides?: Partial<Record<PlatformType, PlatformOverride>> },
  ) => {
    await createPost(content, platforms, scheduledFor, extras);
  };

  return (
    <AppLayout title="Create Post">
      <div className="max-w-2xl">
        <CreatePostForm onSubmit={handleSubmit} />
      </div>
    </AppLayout>
  );
}
