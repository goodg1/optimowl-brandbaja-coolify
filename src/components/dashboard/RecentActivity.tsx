import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLog } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useBrand } from '@/contexts/BrandContext';

export function RecentActivity() {
  const [activities, setActivities] = useState<(ActivityLog & { user_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedBrand } = useBrand();

  useEffect(() => {
    const fetchActivities = async () => {
      if (!selectedBrand) return;

      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('brand_id', selectedBrand.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setActivities((data || []) as ActivityLog[]);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [selectedBrand]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}