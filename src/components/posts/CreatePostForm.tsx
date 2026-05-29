import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { PlatformType } from '@/types/database';
import { PlatformIcon } from './PlatformIcon';
import { CalendarIcon, Send, Save, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBrand } from '@/contexts/BrandContext';
import { MediaPicker } from '@/components/media/MediaPicker';
import { AIAssistButton } from './AIAssistButton';

export type PlatformOverride = { content?: string; hashtags?: string[] };

interface CreatePostFormProps {
  onSubmit: (
    content: string,
    platforms: PlatformType[],
    scheduledFor?: string,
    extras?: { mediaUrls?: string[]; hashtags?: string[]; overrides?: Partial<Record<PlatformType, PlatformOverride>> },
  ) => Promise<void>;
  loading?: boolean;
}

const platforms: { id: PlatformType; label: string }[] = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'threads', label: 'Threads' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'google_business', label: 'Google Business' },
];

export function CreatePostForm({ onSubmit, loading }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [overrides, setOverrides] = useState<Partial<Record<PlatformType, PlatformOverride>>>({});
  const [showOverrides, setShowOverrides] = useState(false);
  const { selectedBrand } = useBrand();

  const togglePlatform = (platform: PlatformType) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;

    let scheduledFor: string | undefined;
    if (isScheduling && scheduledDate) {
      const [hours, minutes] = scheduledTime.split(':');
      const date = new Date(scheduledDate);
      date.setHours(parseInt(hours), parseInt(minutes));
      scheduledFor = date.toISOString();
    }

    await onSubmit(content, selectedPlatforms, scheduledFor, { mediaUrls, hashtags, overrides });
    setContent('');
    setSelectedPlatforms([]);
    setMediaUrls([]);
    setHashtags([]);
    setScheduledDate(undefined);
    setIsScheduling(false);
    setOverrides({});
  };

  const characterCount = content.length;
  const maxChars = 2200;

  const appendHashtags = (tags: string[]) => {
    setHashtags((prev) => Array.from(new Set([...prev, ...tags])));
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Create Post
          {selectedBrand && (
            <span className="text-sm font-normal text-muted-foreground">for {selectedBrand.name}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            placeholder="What would you like to share?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] resize-none"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => setPickerOpen(true)} type="button">
                <ImageIcon className="h-4 w-4" />
                Media{mediaUrls.length > 0 ? ` (${mediaUrls.length})` : ''}
              </Button>
              <AIAssistButton
                content={content}
                platforms={selectedPlatforms}
                onContentChange={setContent}
                onAppendHashtags={appendHashtags}
              />
            </div>
            <span className={cn(characterCount > maxChars && 'text-destructive')}>
              {characterCount} / {maxChars}
            </span>
          </div>
        </div>

        {mediaUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mediaUrls.map((url) => (
              <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border bg-muted">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setMediaUrls((prev) => prev.filter((u) => u !== url))}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/90 flex items-center justify-center"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((h) => (
              <Badge key={h} variant="secondary" className="gap-1">
                {h}
                <button type="button" onClick={() => setHashtags((prev) => prev.filter((x) => x !== h))} aria-label="Remove">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <Label>Platforms</Label>
          <div className="flex flex-wrap gap-3">
            {platforms.map(({ id, label }) => (
              <label
                key={id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all',
                  selectedPlatforms.includes(id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30',
                )}
              >
                <Checkbox
                  checked={selectedPlatforms.includes(id)}
                  onCheckedChange={() => togglePlatform(id)}
                  className="sr-only"
                />
                <PlatformIcon platform={id} size="sm" />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedPlatforms.length > 1 && (
          <div className="space-y-3 rounded-lg border p-4">
            <button
              type="button"
              onClick={() => setShowOverrides((v) => !v)}
              className="flex items-center justify-between w-full text-sm font-medium"
            >
              <span>Per-platform copy <span className="text-muted-foreground font-normal">(optional)</span></span>
              <span className="text-xs text-muted-foreground">{showOverrides ? 'Hide' : 'Customize'}</span>
            </button>
            {showOverrides && (
              <div className="space-y-3 pt-2">
                {selectedPlatforms.map((p) => (
                  <div key={p} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={p} size="sm" />
                      <Label className="text-xs capitalize">{p.replace('_', ' ')}</Label>
                    </div>
                    <Textarea
                      placeholder={`Override for ${p.replace('_', ' ')} (leave blank to use shared copy)`}
                      value={overrides[p]?.content ?? ''}
                      onChange={(e) =>
                        setOverrides((prev) => ({ ...prev, [p]: { ...prev[p], content: e.target.value } }))
                      }
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="schedule"
              checked={isScheduling}
              onCheckedChange={(checked) => setIsScheduling(checked === true)}
            />
            <Label htmlFor="schedule" className="cursor-pointer">Schedule for later</Label>
          </div>

          {isScheduling && (
            <div className="flex gap-3 animate-fade-in">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-[140px]"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSubmit}
            disabled={!content.trim() || selectedPlatforms.length === 0 || loading}
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button
            className="gap-2"
            onClick={handleSubmit}
            disabled={!content.trim() || selectedPlatforms.length === 0 || loading}
          >
            <Send className="h-4 w-4" />
            Submit for Review
          </Button>
        </div>
      </CardContent>

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selected={mediaUrls}
        onConfirm={(urls) => setMediaUrls(urls)}
        multi
      />
    </Card>
  );
}
