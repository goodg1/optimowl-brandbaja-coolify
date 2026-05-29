import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BrandCard } from '@/components/brands/BrandCard';
import { CreateBrandDialog } from '@/components/brands/CreateBrandDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';

export default function BrandsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { brands, loading } = useBrand();

  return (
    <AppLayout title="Brands">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Brand
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
        {brands.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            No brands yet. Add your first brand to get started!
          </div>
        )}
        <CreateBrandDialog open={showCreate} onOpenChange={setShowCreate} />
      </div>
    </AppLayout>
  );
}