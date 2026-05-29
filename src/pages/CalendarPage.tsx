import { AppLayout } from '@/components/layout/AppLayout';
import { CalendarView } from '@/components/calendar/CalendarView';
import { usePosts } from '@/hooks/usePosts';

export default function CalendarPage() {
  const { posts } = usePosts();

  return (
    <AppLayout title="Calendar">
      <CalendarView posts={posts} />
    </AppLayout>
  );
}