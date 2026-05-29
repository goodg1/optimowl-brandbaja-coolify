import { useMemo } from 'react';
import { Post, PlatformType, PostStatus } from '@/types/database';
import { format, eachDayOfInterval, subDays, startOfDay } from 'date-fns';

export function useAnalytics(posts: Post[], days: number) {
  return useMemo(() => {
    const since = startOfDay(subDays(new Date(), days - 1));
    const inRange = posts.filter((p) => new Date(p.created_at) >= since);

    const counts = {
      created: inRange.length,
      approved: inRange.filter((p) => ['approved', 'scheduled', 'published'].includes(p.status)).length,
      scheduled: inRange.filter((p) => p.status === 'scheduled').length,
      published: inRange.filter((p) => p.status === 'published').length,
    };

    const dayBuckets = eachDayOfInterval({ start: since, end: new Date() }).map((d) => ({
      date: format(d, 'MMM d'),
      iso: format(d, 'yyyy-MM-dd'),
      published: 0,
      created: 0,
    }));
    const byIso = new Map(dayBuckets.map((b) => [b.iso, b]));
    inRange.forEach((p) => {
      const c = byIso.get(format(new Date(p.created_at), 'yyyy-MM-dd'));
      if (c) c.created++;
      if (p.published_at) {
        const pub = byIso.get(format(new Date(p.published_at), 'yyyy-MM-dd'));
        if (pub) pub.published++;
      }
    });

    const platformCounts: Record<PlatformType, number> = {
      facebook: 0, instagram: 0, threads: 0, linkedin: 0, google_business: 0, x: 0,
    };
    inRange.forEach((p) => p.platforms.forEach((pl) => { platformCounts[pl] = (platformCounts[pl] ?? 0) + 1; }));
    const platformData = Object.entries(platformCounts).map(([platform, count]) => ({ platform, count }));

    const statusCounts: Record<PostStatus, number> = {
      draft: 0, pending_manager: 0, pending_client: 0, approved: 0, scheduled: 0, published: 0, rejected: 0,
    };
    inRange.forEach((p) => { statusCounts[p.status]++; });
    const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status: status.replace('_', ' '), count }));

    return { counts, dayBuckets, platformData, statusData };
  }, [posts, days]);
}
