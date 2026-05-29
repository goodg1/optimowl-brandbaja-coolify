import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Check, Trash2 } from 'lucide-react';
import { useMedia, MediaAsset } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  onConfirm: (urls: string[]) => void;
  multi?: boolean;
}

export function MediaPicker({ open, onOpenChange, selected, onConfirm, multi = true }: Props) {
  const { assets, loading, uploading, uploadFiles, deleteAsset } = useMedia();
  const [picked, setPicked] = useState<string[]>(selected);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggle = (url: string) => {
    setPicked((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url);
      return multi ? [...prev, url] : [url];
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const created = await uploadFiles(files);
    if (created.length) {
      const newUrls = created.map((c) => c.public_url);
      setPicked((prev) => (multi ? [...prev, ...newUrls] : [newUrls[0]]));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media library</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2 py-2">
          <p className="text-sm text-muted-foreground">{assets.length} item{assets.length === 1 ? '' : 's'}</p>
          <div>
            <input ref={fileRef} type="file" accept="image/*" multiple={multi} className="hidden" onChange={handleFiles} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
              <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground p-6 text-center">Loading…</p>
          ) : assets.length === 0 ? (
            <p className="text-sm text-muted-foreground p-12 text-center">No media yet. Upload your first asset.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
              {assets.map((a) => (
                <MediaTile key={a.id} asset={a} selected={picked.includes(a.public_url)} onToggle={() => toggle(a.public_url)} onDelete={() => deleteAsset(a)} />
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onConfirm(picked); onOpenChange(false); }} disabled={picked.length === 0}>
            Attach {picked.length > 0 ? `(${picked.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MediaTile({ asset, selected, onToggle, onDelete }: { asset: MediaAsset; selected: boolean; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={cn('relative group rounded-lg overflow-hidden border-2 transition-all', selected ? 'border-primary' : 'border-transparent')}>
      <button type="button" onClick={onToggle} className="block w-full aspect-square bg-muted">
        <img src={asset.public_url} alt="" className="w-full h-full object-cover" />
      </button>
      {selected && (
        <div className="absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="h-4 w-4" />
        </div>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-background/80 text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-background"
        aria-label="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
