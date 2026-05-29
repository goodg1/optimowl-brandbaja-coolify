import { useState, useMemo } from 'react';
import { Post, PostStatus, PlatformType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlatformIcon } from '@/components/posts/PlatformIcon';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  posts: Post[];
  onPostClick?: (post: Post) => void;
}

export function CalendarView({ posts, onPostClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts
      .filter(p => p.scheduled_for || p.published_at)
      .forEach(post => {
        const date = post.scheduled_for || post.published_at;
        if (date) {
          const key = format(new Date(date), 'yyyy-MM-dd');
          const existing = map.get(key) || [];
          map.set(key, [...existing, post]);
        }
      });
    return map;
  }, [posts]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  const today = startOfDay(new Date());

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Publishing Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <div className="flex">
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayPosts = postsByDate.get(dayKey) || [];
            const isToday = isSameDay(day, today);

            return (
              <div
                key={dayKey}
                className={cn(
                  'bg-card min-h-[120px] p-2 space-y-1',
                  isToday && 'bg-primary/5'
                )}
              >
                <div className={cn(
                  'text-xs font-medium mb-2',
                  isToday ? 'text-primary' : 'text-muted-foreground'
                )}>
                  <span className="block">{format(day, 'EEE')}</span>
                  <span className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full',
                    isToday && 'bg-primary text-primary-foreground'
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      onClick={() => onPostClick?.(post)}
                      className="w-full text-left p-1.5 rounded text-xs bg-secondary/50 hover:bg-secondary transition-colors truncate flex items-center gap-1"
                    >
                      {post.platforms[0] && <PlatformIcon platform={post.platforms[0]} size="sm" className="shrink-0 h-4 w-4" />}
                      <span className="truncate">{post.content.slice(0, 30)}</span>
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-xs text-muted-foreground px-1">
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}