"use client";

import { useState, useEffect } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface CouponStatusNotificationProps {
  onUpdateCoupons?: () => void;
}

export default function CouponStatusNotification({ onUpdateCoupons }: CouponStatusNotificationProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Check for coupons needing updates
  const checkForUpdates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coupons/update-status');
      
      if (response.ok) {
        const data = await response.json();
        if (data.couponsNeedingUpdate && data.couponsNeedingUpdate.length > 0) {
          setNotifications(data.couponsNeedingUpdate);
        }
      }
    } catch (error) {
      console.error('Error checking for coupon updates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-apply updates
  const applyUpdates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coupons/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.updatedCount > 0) {
          setNotifications([]);
          if (onUpdateCoupons) {
            onUpdateCoupons();
          }
        }
      }
    } catch (error) {
      console.error('Error applying coupon updates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for updates on component mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  // Dismiss notification
  const dismissNotification = () => {
    setNotifications([]);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <BellIcon className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Coupon Status Updates Available
            </h3>
            <p className="text-xs text-blue-600 mt-1">
              {notifications.length} coupon{notifications.length !== 1 ? 's' : ''} need{notifications.length === 1 ? 's' : ''} status update{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={dismissNotification}
          className="text-blue-400 hover:text-blue-600"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="mt-3 space-y-2">
        {notifications.slice(0, 3).map((notification) => (
          <div key={notification.id} className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
            <strong>{notification.code}</strong> ({notification.product}): {notification.currentStatus} → {notification.suggestedStatus}
          </div>
        ))}
        {notifications.length > 3 && (
          <div className="text-xs text-blue-600">
            ...and {notifications.length - 3} more
          </div>
        )}
      </div>
      
      <div className="mt-3 flex gap-2">
        <button
          onClick={applyUpdates}
          disabled={loading}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Updating...' : 'Apply Updates'}
        </button>
        <button
          onClick={dismissNotification}
          className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
