"use client";

import React, { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { CircularProgress, Button } from "@mui/material";

const OrdersListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect unauthenticated users
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/profile/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          throw new Error(data.error || 'Failed to fetch orders');
        }
      } catch (err) {
        setError("Failed to load orders");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, router]);

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-[60vh]">
          <CircularProgress />
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-[60vh] flex-col">
          <div className="text-red-500 mb-4">{error}</div>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg shadow-md text-center">
            <p className="text-lg">You haven't placed any orders yet.</p>
            <Button 
              variant="contained" 
              className="mt-4"
              onClick={() => router.push('/')}
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div key={order._id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    Order #{order.orderNumber || order._id.substring(0, 8)}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status || 'Processing'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p>Total: ${typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : '0.00'}</p>
                </div>
                
                <Button 
                  variant="outlined"
                  onClick={() => router.push(`/orders/${order._id}`)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default OrdersListPage;
