"use client";
import { useState, useEffect } from "react";
import { Button, Link, CircularProgress } from "@mui/material";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProfilePageToNav from "../../components/ProfilePageToNav";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

// Define order interface to match the API response
interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  _id: string;
  status: string;
  orderItems: OrderItem[];
  createdAt: string;
  totalPrice: number;
  orderNumber?: string;
}

export default function ToReviewPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { user } = useAuth();
  const router = useRouter();

  // Fetch customer's orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/profile/orders');
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Format and filter orders to only show delivered ones
          const formattedOrders = data.orders
            .map((order: any) => ({
              _id: order._id,
              orderNumber: order.orderNumber || `ORD-${order._id.substring(0, 8)}`,
              status: order.status || 'processing',
              orderItems: Array.isArray(order.orderItems) ? order.orderItems : 
                         (order.line_items ? order.line_items.map((item: any) => ({
                           name: item.price_data?.product_data || 'Product',
                           price: item.price_data?.unit_amount ? item.price_data.unit_amount/100 : 0,
                           quantity: item.quantity || 1,
                           image: item.metadata?.imageUrl || '/placeholder.jpg'
                         })) : []),
              createdAt: order.createdAt || new Date().toISOString(),
              totalPrice: order.totalPrice || (order.amount?.total || 0)
            }))
            .filter((order: Order) => 
              order.status.toLowerCase() === 'delivered' || 
              order.status.toLowerCase() === 'completed'
            );
          
          setOrders(formattedOrders);
        } else {
          throw new Error(data.error || 'Failed to fetch orders');
        }
      } catch (err) {
        setError("Failed to load orders");
        console.error(err);
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
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">To Review</h2>
        <ProfilePageToNav/>
        
        {orders.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg shadow-md text-center">
            <p className="text-lg">You don't have any delivered orders to review yet.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-gray-100 p-4 rounded-lg shadow-md mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Order #{order.orderNumber || order._id.substring(0, 8)}</h3>
                <span className="bg-green-600 text-white px-3 py-1 rounded-lg">{order.status}</span>
              </div>
              
              {order.orderItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 mt-4">
                  <img 
                    src={item.image || '/placeholder.jpg'} 
                    alt={item.name} 
                    className="w-16 h-16 rounded-lg object-cover" 
                  />
                  <div className="flex-grow">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-lg font-bold">Rs. {typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A'}</p>
                  </div>
                  <div className="ml-auto text-sm text-gray-600">
                    Qty: {item.quantity}
                  </div>
                </div>
              ))}
              
              <div className="text-right mt-2">
                <p className="font-semibold">
                  Total: Rs. {typeof order.totalPrice === 'number' ? 
                    order.totalPrice.toFixed(2) : 
                    order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                </p>
                <Link href={`/review/product/${order._id}`}>
                  <button className="text-sm bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 mt-3 mb-1">
                    Review
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      <Footer />
    </>
  );
}
