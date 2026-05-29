import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { usePosts } from '@/hooks/usePosts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))', 'hsl(var(--chart-1, var(--primary)))', 'hsl(var(--chart-2, var(--secondary)))'];

export default function AnalyticsPage() {
  const { posts, loading } = usePosts();
  const [days, setDays] = useState(30);
  const data = useAnalytics(posts, days);

  return (
    <AppLayout title="Analytics">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Last {days} days</p>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Created', value: data.counts.created },
            { label: 'Approved', value: data.counts.approved },
            { label: 'Scheduled', value: data.counts.scheduled },
            { label: 'Published', value: data.counts.published },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{kpi.label}</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{kpi.value}</p></CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Posts over time</CardTitle></CardHeader>
              <CardContent style={{ height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={data.dayBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="published" stroke="hsl(var(--accent-foreground))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">By platform</CardTitle></CardHeader>
                <CardContent style={{ height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.platformData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Status breakdown</CardTitle></CardHeader>
                <CardContent style={{ height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.statusData.filter(s => s.count > 0)} dataKey="count" nameKey="status" outerRadius={90} label>
                        {data.statusData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">External engagement</CardTitle></CardHeader>
              <CardContent>
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Connect a social platform (Meta, LinkedIn, Google Business) to populate likes, comments, shares, reach, and impressions for your published posts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {loading && <p className="text-xs text-muted-foreground">Refreshing…</p>}
      </div>
    </AppLayout>
  );
}
