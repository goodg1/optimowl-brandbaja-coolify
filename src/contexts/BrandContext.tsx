import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Brand } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface BrandContextType {
  brands: Brand[];
  selectedBrand: Brand | null;
  selectBrand: (brand: Brand) => void;
  loading: boolean;
  refetchBrands: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBrands = async () => {
    if (!user) {
      setBrands([]);
      setSelectedBrand(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;

      const brandsList = (data || []) as Brand[];
      setBrands(brandsList);
      
      if (!selectedBrand && brandsList.length > 0) {
        setSelectedBrand(brandsList[0]);
      } else if (selectedBrand) {
        const stillExists = brandsList.find(b => b.id === selectedBrand.id);
        if (!stillExists) {
          setSelectedBrand(brandsList[0] || null);
        }
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [user]);

  const selectBrand = (brand: Brand) => {
    setSelectedBrand(brand);
  };

  return (
    <BrandContext.Provider value={{ brands, selectedBrand, selectBrand, loading, refetchBrands: fetchBrands }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}