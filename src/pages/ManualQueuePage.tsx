import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useManualQueue, composerUrl } from '@/hooks/useManualQueue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PlatformIcon } from '@/components/posts/PlatformIcon';
import { Copy, ExternalLink, Download, Check, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ManualQueuePage() {
  const { items, loading, markPosted } = useManualQueue();
  const { toast } = useToast();
  const [externalUrls, setExternalUrls] = useState<Record<string, string>>({});

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manual Queue</h1>
          <p className="text-muted-foreground">Posts that need to be published manually on their platform.</p>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}

        {!loading && items.length === 0 && (
          <Card><CardContent className="py-16 flex flex-col items-center text-center gap-3">
            <Inbox className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium">All caught up</p>
            <p className="text-sm text-muted-foreground">When a scheduled post can't auto-publish, it'll appear here.</p>
          </CardContent></Card>
        )}

        {items.map((item) => {
          const content = item.content_override ?? item.post.content;
          const hashtags = item.hashtags_override ?? item.post.hashtags ?? [];
          const fullText = [content, hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')].filter(Boolean).join('\n\n');
          const url = composerUrl(item.platform, content, hashtags, item.post.link_url);
          return (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={item.platform} size="md" />
                    <div>
                      <p className="font-semibold capitalize">{item.platform.replace('_', ' ')}</p>
                      {item.post.scheduled_for && (
                        <p className="text-xs text-muted-foreground">
                          Scheduled {format(new Date(item.post.scheduled_for), 'PPp')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">Needs manual post</Badge>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <p className="whitespace-pre-wrap text-sm">{content}</p>
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {hashtags.map(h => <Badge key={h} variant="outline" className="text-xs">#{h.replace(/^#/, '')}</Badge>)}
                    </div>
                  )}
                  {item.post.media_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.post.media_urls.map((m) => (
                        <a key={m} href={m} target="_blank" rel="noopener noreferrer" download
                           className="relative h-20 w-20 rounded border overflow-hidden group">
                          <img src={m} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Download className="h-4 w-4 text-background" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(fullText)} className="gap-2">
                    <Copy className="h-4 w-4" /> Copy text
                  </Button>
                  <Button size="sm" variant="outline" asChild className="gap-2">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> Open {item.platform.replace('_', ' ')} composer
                    </a>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                  <Input
                    placeholder="Paste live post URL (optional)"
                    value={externalUrls[item.id] ?? ''}
                    onChange={(e) => setExternalUrls(s => ({ ...s, [item.id]: e.target.value }))}
                    className="max-w-md"
                  />
                  <Button size="sm" className="gap-2" onClick={() => markPosted(item.id, externalUrls[item.id] || undefined)}>
                    <Check className="h-4 w-4" /> Mark as posted
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
