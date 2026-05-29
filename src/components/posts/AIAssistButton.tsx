import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PlatformType } from '@/types/database';
import { useBrand } from '@/contexts/BrandContext';

interface Props {
  content: string;
  platforms: PlatformType[];
  onContentChange: (next: string) => void;
  onAppendHashtags: (tags: string[]) => void;
}

const platformOptions: { value: PlatformType; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'threads', label: 'Threads' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google_business', label: 'Google Business' },
];

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-content`;

export function AIAssistButton({ content, platforms, onContentChange, onAppendHashtags }: Props) {
  const { toast } = useToast();
  const { selectedBrand } = useBrand();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<null | 'generate' | 'rewrite' | 'hashtags'>(null);
  const [idea, setIdea] = useState('');
  const [rewritePlatform, setRewritePlatform] = useState<PlatformType>(platforms[0] ?? 'instagram');

  const authHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    } as Record<string, string>;
  };

  const handleHttpError = async (resp: Response): Promise<string | null> => {
    if (resp.ok) return null;
    let msg = `Error ${resp.status}`;
    try {
      const j = await resp.json();
      msg = j.error || msg;
    } catch { /* ignore */ }
    if (resp.status === 429) toast({ title: 'Rate limited', description: 'Please wait a moment and try again.', variant: 'destructive' });
    else if (resp.status === 402) toast({ title: 'AI credits exhausted', description: 'Add credits in Workspace Settings.', variant: 'destructive' });
    else toast({ title: 'AI error', description: msg, variant: 'destructive' });
    return msg;
  };

  const streamInto = async (resp: Response, replace: boolean) => {
    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let acc = replace ? '' : content + (content && !content.endsWith('\n') ? '\n\n' : '');
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      if (d) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') { done = true; break; }
        try {
          const parsed = JSON.parse(json);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            acc += delta;
            onContentChange(acc);
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }
  };

  const generate = async () => {
    if (!idea.trim()) return;
    setBusy('generate');
    try {
      const resp = await fetch(FN_URL, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ mode: 'generate', idea, platforms, brandName: selectedBrand?.name }),
      });
      if (await handleHttpError(resp)) return;
      await streamInto(resp, true);
      setOpen(false);
      setIdea('');
    } finally { setBusy(null); }
  };

  const rewrite = async () => {
    if (!content.trim()) {
      toast({ title: 'Add some content first', description: 'Write a draft to rewrite.' });
      return;
    }
    setBusy('rewrite');
    try {
      const resp = await fetch(FN_URL, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ mode: 'rewrite', content, platform: rewritePlatform }),
      });
      if (await handleHttpError(resp)) return;
      await streamInto(resp, true);
      setOpen(false);
    } finally { setBusy(null); }
  };

  const hashtags = async () => {
    if (!content.trim()) {
      toast({ title: 'Add some content first', description: 'Write a draft to get hashtag suggestions.' });
      return;
    }
    setBusy('hashtags');
    try {
      const resp = await fetch(FN_URL, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ mode: 'hashtags', content }),
      });
      if (await handleHttpError(resp)) return;
      const data = await resp.json();
      onAppendHashtags(data.hashtags ?? []);
      toast({ title: `Added ${data.hashtags?.length ?? 0} hashtags` });
      setOpen(false);
    } finally { setBusy(null); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
          <Sparkles className="h-4 w-4" />
          AI Assist
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Draft from idea</Label>
          <div className="flex gap-2">
            <Input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="E.g. launch our new feature" />
            <Button size="sm" onClick={generate} disabled={!idea.trim() || busy !== null}>
              {busy === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Draft'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Rewrite for platform</Label>
          <div className="flex gap-2">
            <Select value={rewritePlatform} onValueChange={(v) => setRewritePlatform(v as PlatformType)}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {platformOptions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={rewrite} disabled={busy !== null}>
              {busy === 'rewrite' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rewrite'}
            </Button>
          </div>
        </div>

        <Button variant="secondary" className="w-full gap-2" onClick={hashtags} disabled={busy !== null}>
          {busy === 'hashtags' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Suggest hashtags
        </Button>
      </PopoverContent>
    </Popover>
  );
}
