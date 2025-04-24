import { useState, useEffect, useCallback } from 'react';
import { productService } from '@/services/productService';
import { CATEGORIES } from '@/lib/constants';

export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [genderLoading, setGenderLoading] = useState(false);
  const [accessoriesLoading, setAccessoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('women');
  
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any[]>>({
    [CATEGORIES.MEN.stateKey]: [],
    [CATEGORIES.WOMEN.stateKey]: [],
    [CATEGORIES.ACCESSORIES.id]: []
  });

  // Function to fetch all products and categorize them
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all products
      const data = await productService.getAllProducts();
      
      if (data && data.length > 0) {
        setProducts(data);
        
        // Organize products by category - use lowercase consistently
        const productsByCategory: Record<string, any[]> = {
          [CATEGORIES.MEN.stateKey]: [],
          [CATEGORIES.WOMEN.stateKey]: [],
          [CATEGORIES.ACCESSORIES.id]: []
        };
        
        data.forEach((product: any) => {
          const category = product.category?.toLowerCase() || "";
          console.log(`Product: ${product.name}, Category: ${category}`);
          
          // Match category to our predefined categories
          if (category === CATEGORIES.MEN.id || category === CATEGORIES.MEN.stateKey) {
            productsByCategory[CATEGORIES.MEN.stateKey].push(product);
          } else if (category === CATEGORIES.WOMEN.id || category === CATEGORIES.WOMEN.stateKey) {
            productsByCategory[CATEGORIES.WOMEN.stateKey].push(product);
          } else {
            productsByCategory[CATEGORIES.ACCESSORIES.id].push(product);
          }
        });
        
        console.log("Categorized products:", {
          menProducts: productsByCategory[CATEGORIES.MEN.stateKey].length,
          womenProducts: productsByCategory[CATEGORIES.WOMEN.stateKey].length,
          accessoriesProducts: productsByCategory[CATEGORIES.ACCESSORIES.id].length
        });
        
        setCategoryProducts(productsByCategory);
      }
      
      // Fetch trending products
      const trendingData = await productService.getTrendingProducts();
      setTrendingProducts(trendingData || []);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products by specific category when gender toggle changes
  const fetchProductsByCategory = useCallback(async (category: string) => {
    try {
      if (category === CATEGORIES.MEN.id || category === CATEGORIES.WOMEN.id) {
        setGenderLoading(true);
      }
      
      const data = await productService.getProductsByCategory(category);
      console.log(`Fetched ${category} products:`, data?.length || 0);
      
      // Update just the specific category in our state
      if (category === CATEGORIES.MEN.id) {
        setCategoryProducts(prev => ({
          ...prev,
          [CATEGORIES.MEN.stateKey]: data
        }));
      } else if (category === CATEGORIES.WOMEN.id) {
        setCategoryProducts(prev => ({
          ...prev,
          [CATEGORIES.WOMEN.stateKey]: data
        }));
      } else if (category === CATEGORIES.ACCESSORIES.id) {
        setCategoryProducts(prev => ({
          ...prev,
          [CATEGORIES.ACCESSORIES.id]: data
        }));
      }
      
    } catch (err) {
      console.error(`Error fetching ${category} products:`, err);
    } finally {
      if (category === CATEGORIES.MEN.id || category === CATEGORIES.WOMEN.id) {
        setGenderLoading(false);
      } else if (category === CATEGORIES.ACCESSORIES.id) {
        setAccessoriesLoading(false);
      }
    }
  }, []);

  // Improved fetchAccessoriesProducts with better error handling
  const fetchAccessoriesProducts = useCallback(async () => {
    try {
      setAccessoriesLoading(true);
      console.log('Fetching accessories products...');
      
      const data = await productService.getProductsByCategory(CATEGORIES.ACCESSORIES.id);
      console.log(`Fetched ${data?.length || 0} accessories products`);
      
      // Debug the categories to make sure matching is working
      if (data?.length > 0) {
        console.log('Accessories product categories:', 
          data.map((p: any) => p.category));
      } else {
        console.log('No accessories products found in the API response');
      }
      
      // Update state only if we have products or an empty array
      setCategoryProducts(prev => ({
        ...prev,
        [CATEGORIES.ACCESSORIES.id]: data || []
      }));
      
    } catch (err) {
      console.error(`Error fetching accessories products:`, err);
      // On error, ensure we don't leave the carousel in a loading state
      setCategoryProducts(prev => ({
        ...prev,
        [CATEGORIES.ACCESSORIES.id]: [] // Reset to empty array on error
      }));
    } finally {
      setAccessoriesLoading(false);
    }
  }, []);

  // Handle gender toggle with debug info
  const handleGenderToggle = useCallback((gender: 'men' | 'women') => {
    console.log(`Switching to ${gender} products`);
    setSelectedGender(gender);
  }, []);

  return {
    products,
    trendingProducts,
    loading,
    genderLoading,
    accessoriesLoading,
    error,
    selectedGender,
    categoryProducts,
    fetchProducts,
    fetchProductsByCategory,
    fetchAccessoriesProducts,
    handleGenderToggle,
    setSelectedGender
  };
};
