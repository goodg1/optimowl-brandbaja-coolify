import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';

export interface MediaAsset {
  id: string;
  brand_id: string;
  uploaded_by: string | null;
  storage_path: string;
  public_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export function useMedia() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { selectedBrand } = useBrand();
  const { toast } = useToast();

  const fetchAssets = useCallback(async () => {
    if (!selectedBrand) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('brand_id', selectedBrand.id)
      .order('created_at', { ascending: false });
    if (!error) setAssets((data || []) as MediaAsset[]);
    setLoading(false);
  }, [selectedBrand]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const uploadFiles = async (files: File[]): Promise<MediaAsset[]> => {
    if (!user || !selectedBrand) return [];
    setUploading(true);
    const created: MediaAsset[] = [];
    try {
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'bin';
        const path = `${selectedBrand.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('media').getPublicUrl(path);

        // get image dims if possible
        let width: number | null = null;
        let height: number | null = null;
        if (file.type.startsWith('image/')) {
          try {
            const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
              img.onerror = reject;
              img.src = URL.createObjectURL(file);
            });
            width = dims.w;
            height = dims.h;
          } catch { /* ignore */ }
        }

        const { data: row, error: insErr } = await supabase
          .from('media_assets')
          .insert({
            brand_id: selectedBrand.id,
            uploaded_by: user.id,
            storage_path: path,
            public_url: pub.publicUrl,
            mime_type: file.type || null,
            size_bytes: file.size,
            width,
            height,
          })
          .select()
          .single();
        if (insErr) throw insErr;
        if (row) created.push(row as MediaAsset);
      }
      toast({ title: 'Upload complete', description: `${created.length} file${created.length === 1 ? '' : 's'} uploaded.` });
      await fetchAssets();
      return created;
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Upload failed', description: e.message ?? 'Try again.', variant: 'destructive' });
      return created;
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (asset: MediaAsset) => {
    try {
      await supabase.storage.from('media').remove([asset.storage_path]);
      const { error } = await supabase.from('media_assets').delete().eq('id', asset.id);
      if (error) throw error;
      toast({ title: 'Deleted' });
      await fetchAssets();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  return { assets, loading, uploading, uploadFiles, deleteAsset, refetch: fetchAssets };
}
