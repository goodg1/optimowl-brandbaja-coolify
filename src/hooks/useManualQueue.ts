import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBrand } from '@/contexts/BrandContext';
import { PlatformType, PlatformAttemptStatus, PostPlatformAttempt } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export interface ManualQueueItem extends PostPlatformAttempt {
  post: {
    id: string;
    content: string;
    media_urls: string[];
    hashtags: string[];
    link_url: string | null;
    scheduled_for: string | null;
    brand_id: string;
  };
}

export function useManualQueue() {
  const { selectedBrand } = useBrand();
  const [items, setItems] = useState<ManualQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!selectedBrand) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('post_platform_attempts')
      .select('*, post:posts!inner(id, content, media_urls, hashtags, link_url, scheduled_for, brand_id)')
      .eq('status', 'needs_manual')
      .eq('post.brand_id', selectedBrand.id)
      .order('created_at', { ascending: true });

    if (!error) setItems((data ?? []) as unknown as ManualQueueItem[]);
    setLoading(false);
  }, [selectedBrand]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // realtime
  useEffect(() => {
    if (!selectedBrand) return;
    const channel = supabase
      .channel('manual-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_platform_attempts' }, () => fetchItems())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedBrand, fetchItems]);

  const markPosted = async (attemptId: string, externalUrl?: string) => {
    const { error } = await supabase.functions.invoke('mark-posted-manually', {
      body: { attempt_id: attemptId, external_url: externalUrl },
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Marked as posted' });
    await fetchItems();
    return true;
  };

  return { items, loading, fetchItems, markPosted };
}

export function composerUrl(platform: PlatformType, content: string, hashtags: string[], linkUrl?: string | null) {
  const text = [content, hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')].filter(Boolean).join('\n\n');
  const enc = encodeURIComponent(text);
  const encUrl = linkUrl ? encodeURIComponent(linkUrl) : '';
  switch (platform) {
    case 'x':
      return `https://x.com/intent/post?text=${enc}${encUrl ? `&url=${encUrl}` : ''}`;
    case 'linkedin':
      return `https://www.linkedin.com/feed/?shareActive=true&text=${enc}`;
    case 'facebook':
      return linkUrl
        ? `https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${enc}`
        : `https://www.facebook.com/`;
    case 'threads':
      return `https://www.threads.net/intent/post?text=${enc}`;
    case 'instagram':
      return `https://www.instagram.com/`;
    case 'google_business':
      return `https://business.google.com/posts`;
  }
}
