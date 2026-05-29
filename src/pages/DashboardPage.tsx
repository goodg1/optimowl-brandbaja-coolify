import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { CalendarView } from '@/components/calendar/CalendarView';
import { usePosts } from '@/hooks/usePosts';
import { useBrand } from '@/contexts/BrandContext';

export default function DashboardPage() {
  const { posts } = usePosts();
  const { selectedBrand } = useBrand();

  const stats = {
    drafts: posts.filter(p => p.status === 'draft').length,
    pending: posts.filter(p => p.status === 'pending_manager' || p.status === 'pending_client').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
  };

  return (
    <AppLayout title={selectedBrand?.name || 'Dashboard'}>
      <div className="space-y-6">
        <StatsCards {...stats} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CalendarView posts={posts} />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}