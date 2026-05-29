import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post, PostStatus, PlatformType } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';

export function usePosts(statusFilter?: PostStatus[]) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { selectedBrand } = useBrand();
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    if (!user || !selectedBrand) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('brand_id', selectedBrand.id)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPosts((data || []) as Post[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedBrand, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (
    content: string,
    platforms: PlatformType[],
    scheduledFor?: string,
    extras?: {
      mediaUrls?: string[];
      hashtags?: string[];
      overrides?: Partial<Record<PlatformType, { content?: string; hashtags?: string[] }>>;
    },
  ) => {
    if (!user || !selectedBrand) return null;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          brand_id: selectedBrand.id,
          created_by: user.id,
          content,
          platforms,
          media_urls: extras?.mediaUrls ?? [],
          hashtags: extras?.hashtags ?? [],
          scheduled_for: scheduledFor || null,
          status: 'draft' as PostStatus
        })
        .select()
        .single();

      if (error) throw error;

      // Seed per-platform attempt rows so overrides are stored and the scheduler has rows to act on
      const overrides = extras?.overrides ?? {};
      const attemptRows = platforms.map((p) => ({
        post_id: data.id,
        platform: p,
        content_override: overrides[p]?.content?.trim() ? overrides[p]!.content!.trim() : null,
        hashtags_override: overrides[p]?.hashtags ?? null,
        status: 'pending' as const,
      }));
      if (attemptRows.length > 0) {
        await supabase.from('post_platform_attempts').insert(attemptRows);
      }

      toast({ title: 'Post created', description: 'Your draft has been saved.' });
      await fetchPosts();
      return data as Post;
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: 'Error', description: 'Failed to create post.', variant: 'destructive' });
      return null;
    }
  };

  const updatePostStatus = async (postId: string, newStatus: PostStatus, comment?: string) => {
    if (!user) return false;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return false;

      const { error: postError } = await supabase
        .from('posts')
        .update({ 
          status: newStatus,
          ...(newStatus === 'published' ? { published_at: new Date().toISOString() } : {})
        })
        .eq('id', postId);

      if (postError) throw postError;

      await supabase.from('approval_logs').insert({
        post_id: postId,
        user_id: user.id,
        from_status: post.status,
        to_status: newStatus,
        comment
      });

      toast({ title: 'Status updated', description: `Post status changed to ${newStatus.replace('_', ' ')}.` });
      await fetchPosts();
      return true;
    } catch (error) {
      console.error('Error updating post status:', error);
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
      return false;
    }
  };

  const updatePost = async (postId: string, updates: Partial<Post>) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId);

      if (error) throw error;

      toast({ title: 'Post updated' });
      await fetchPosts();
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      toast({ title: 'Error', description: 'Failed to update post.', variant: 'destructive' });
      return false;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;

      toast({ title: 'Post deleted' });
      await fetchPosts();
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: 'Error', description: 'Failed to delete post.', variant: 'destructive' });
      return false;
    }
  };

  return { posts, loading, fetchPosts, createPost, updatePostStatus, updatePost, deletePost };
}