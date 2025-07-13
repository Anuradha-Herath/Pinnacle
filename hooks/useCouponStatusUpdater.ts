import { useEffect, useRef } from 'react';

// Custom hook to automatically update coupon statuses
export const useCouponStatusUpdater = (enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    const updateCouponStatuses = async () => {
      try {
        const response = await fetch('/api/coupons/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.updatedCount > 0) {
            console.log(`Updated ${data.updatedCount} coupon statuses automatically`);
          }
        }
      } catch (error) {
        console.error('Error auto-updating coupon statuses:', error);
      }
    };
    
    // Update immediately on mount
    updateCouponStatuses();
    
    // Set up interval to check every 30 minutes
    intervalRef.current = setInterval(updateCouponStatuses, 30 * 60 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);
  
  const triggerManualUpdate = async () => {
    try {
      const response = await fetch('/api/coupons/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Failed to update coupon statuses');
      }
    } catch (error) {
      console.error('Error manually updating coupon statuses:', error);
      throw error;
    }
  };
  
  return { triggerManualUpdate };
};
