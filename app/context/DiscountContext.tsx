"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface DiscountInfo {
  id: string;
  percentage: number;
  active: boolean;
  productId: string;
  type: string;
  startDate: string;
  endDate: string;
}

interface DiscountContextType {
  discounts: Record<string, DiscountInfo>;
  isLoading: boolean;
  fetchBulkDiscounts: (productIds: string[]) => Promise<void>;
  getProductDiscount: (productId: string) => DiscountInfo | null;
}

const DiscountContext = createContext<DiscountContextType | undefined>(undefined);

export const useDiscounts = () => {
  const context = useContext(DiscountContext);
  if (!context) {
    throw new Error('useDiscounts must be used within a DiscountProvider');
  }
  return context;
};

interface DiscountProviderProps {
  children: React.ReactNode;
}

export const DiscountProvider: React.FC<DiscountProviderProps> = ({ children }) => {
  const [discounts, setDiscounts] = useState<Record<string, DiscountInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedProductIds, setFetchedProductIds] = useState<Set<string>>(new Set());

  const fetchBulkDiscounts = useCallback(async (productIds: string[]) => {
    // Filter out already fetched product IDs to avoid redundant requests
    const newProductIds = productIds.filter(id => !fetchedProductIds.has(id));
    
    if (newProductIds.length === 0) {
      return; // All products already fetched
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/discounts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: newProductIds }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Merge new discounts with existing ones
        setDiscounts(prev => ({
          ...prev,
          ...data.discounts
        }));
        
        // Mark these product IDs as fetched
        setFetchedProductIds(prev => new Set([...prev, ...newProductIds]));
        
        console.log(`Fetched discounts for ${Object.keys(data.discounts).length} products`);
      } else {
        console.warn('Failed to fetch bulk discounts:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching bulk discounts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchedProductIds]);

  const getProductDiscount = useCallback((productId: string): DiscountInfo | null => {
    return discounts[productId] || null;
  }, [discounts]);

  const value: DiscountContextType = {
    discounts,
    isLoading,
    fetchBulkDiscounts,
    getProductDiscount,
  };

  return (
    <DiscountContext.Provider value={value}>
      {children}
    </DiscountContext.Provider>
  );
};
