import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, Send, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  drafts: number;
  pending: number;
  scheduled: number;
  published: number;
}

export function StatsCards({ drafts, pending, scheduled, published }: StatsCardsProps) {
  const stats = [
    { label: 'Drafts', value: drafts, icon: FileText, color: 'text-muted-foreground' },
    { label: 'Pending Approval', value: pending, icon: Clock, color: 'text-warning' },
    { label: 'Scheduled', value: scheduled, icon: Send, color: 'text-primary' },
    { label: 'Published', value: published, icon: CheckCircle, color: 'text-success' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className={cn('h-4 w-4', stat.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}