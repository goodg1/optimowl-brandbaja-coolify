import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBrandDialog({ open, onOpenChange }: CreateBrandDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { refetchBrands } = useBrand();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setLoading(true);
    try {
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert({ name: name.trim(), created_by: user.id })
        .select()
        .single();

      if (brandError) throw brandError;

      // Add the creator as a brand member
      await supabase.from('brand_members').insert({
        brand_id: brand.id,
        user_id: user.id
      });

      toast({ title: 'Brand created', description: `${name} has been added.` });
      await refetchBrands();
      setName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating brand:', error);
      toast({ title: 'Error', description: 'Failed to create brand.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Brand</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter brand name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? 'Creating...' : 'Create Brand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}