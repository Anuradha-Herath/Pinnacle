"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  district: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryMethod: string;
}

interface CustomerInfoAutoFillProps {
  onInfoLoaded: (info: Partial<CustomerInfo>) => void;
}

const CustomerInfoAutoFill: React.FC<CustomerInfoAutoFillProps> = ({ onInfoLoaded }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadCustomerInfo = async () => {
      if (!user || hasLoaded) return;

      setIsLoading(true);
      try {
        // Start with user profile data
        const customerInfo: Partial<CustomerInfo> = {
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || ""
        };

        // Try to get most recent order data
        try {
          const response = await fetch('/api/orders/recent', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.order) {
              const recentOrder = data.order;
              
              // Fill additional fields from most recent order
              if (recentOrder.customer) {
                customerInfo.phone = customerInfo.phone || recentOrder.customer.phone || "";
              }
              
              if (recentOrder.shipping) {
                customerInfo.deliveryMethod = recentOrder.shipping.deliveryMethod || "ship";
                
                if (recentOrder.shipping.address) {
                  customerInfo.district = recentOrder.shipping.address.district || "";
                  customerInfo.address = recentOrder.shipping.address.address || "";
                  customerInfo.city = recentOrder.shipping.address.city || "";
                  customerInfo.postalCode = recentOrder.shipping.address.postalCode || "";
                }
              }
              
              console.log("Loaded customer info from recent order:", customerInfo);
            } else {
              console.log("No recent order found, using profile data only");
            }
          }
        } catch (orderError) {
          console.log("Could not fetch recent order, using profile data only:", orderError);
        }

        // Pass the loaded info to parent component
        onInfoLoaded(customerInfo);
        setHasLoaded(true);
        
      } catch (error) {
        console.error("Error loading customer info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerInfo();
  }, [user, onInfoLoaded, hasLoaded]);

  // This component doesn't render anything visible
  if (isLoading) {
    return (
      <div className="text-xs text-gray-500 mb-2">
        ..............
      </div>
    );
  }

  return null;
};

export default CustomerInfoAutoFill;
