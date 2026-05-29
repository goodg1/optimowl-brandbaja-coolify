import { useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Copy } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function MediaPage() {
  const { assets, loading, uploading, uploadFiles, deleteAsset } = useMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) await uploadFiles(files);
    if (fileRef.current) fileRef.current.value = '';
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({ title: 'Copied URL' });
  };

  return (
    <AppLayout title="Media library">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{assets.length} asset{assets.length === 1 ? '' : 's'} for this brand</p>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
            <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload images'}
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : assets.length === 0 ? (
          <div className="border border-dashed rounded-lg p-12 text-center">
            <p className="text-muted-foreground">No media yet. Upload your first asset to reuse it across posts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {assets.map((a) => (
              <div key={a.id} className="group relative rounded-lg overflow-hidden border bg-card">
                <div className="aspect-square bg-muted">
                  <img src={a.public_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-2 text-xs text-muted-foreground">
                  {format(new Date(a.created_at), 'MMM d, yyyy')}
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => copyUrl(a.public_url)} aria-label="Copy URL">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => deleteAsset(a)} aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
