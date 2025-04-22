"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircularProgress, Button, Alert } from "@mui/material";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useAuth } from "@/app/context/AuthContext";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface Order {
  _id: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  pointsEarned: number; // Add this field
}

export default function OrderDetail() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      if (!orderId) {
        setError("Order ID is missing");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError("Order not found");
          } else if (res.status === 403) {
            setError("You are not authorized to view this order");
          } else {
            setError("Failed to load order details");
          }
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        console.log("Order details:", data);
        
        if (data.success) {
          setOrder(data.order);
        } else {
          setError(data.error || "Failed to load order details");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("An error occurred while loading order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, user, router]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  if (error) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto p-6 flex flex-col items-center">
          <Alert severity="error" className="mb-4">{error}</Alert>
          <Button variant="contained" onClick={() => router.push('/profilepage')}>
            Back to Profile
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Order #{orderId.substring(0, 8)}</h1>
          <span 
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          order?.status === "Order Confirmed"
                            ? "bg-blue-300 text-blue-800"
                            : order?.status === "Order Completed" || order?.status === "Delivered"
                            ? "bg-green-300 text-green-800"
                            : order?.status === "Out For Delivery"
                            ? "bg-orange-300 text-orange-800"
                            : order?.status === "Shipping"
                            ? "bg-cyan-300 text-cyan-800"
                            : order?.status === "Processing"
                            ? "bg-yellow-300 text-yellow-800"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {order?.status}
                      </span>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-6">
          <h2 className="font-semibold text-lg mb-2">Order Information</h2>
          <p><strong>Order Date:</strong> {order?.createdAt && formatDate(order.createdAt)}</p>
          <p><strong>Payment Method:</strong> {order?.paymentMethod}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-6">
          <h2 className="font-semibold text-lg mb-2">Shipping Address</h2>
          <p>{order?.shippingAddress.fullName}</p>
          <p>{order?.shippingAddress.address}</p>
          <p>{order?.shippingAddress.city}, {order?.shippingAddress.postalCode}</p>
          <p>{order?.shippingAddress.country}</p>
          <p>Phone: {order?.shippingAddress.phone}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-6">
          <h2 className="font-semibold text-lg mb-4">Order Items</h2>
          
          {order?.orderItems.map((item, index) => (
            <div key={index} className="flex items-center gap-4 py-4 border-b last:border-b-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-grow">
                <p className="font-semibold">{item.name}</p>
                {item.size && <p className="text-sm text-gray-600">Size: {item.size}</p>}
                {item.color && <p className="text-sm text-gray-600">Color: {item.color}</p>}
              </div>
              <div className="text-right">
                <p>Rs. {item.price.toFixed(2)} × {item.quantity}</p>
                <p className="font-bold">Rs. {(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="font-semibold text-lg mb-2">Order Summary</h2>
          <div className="flex justify-between py-2">
            <span>Items:</span>
            <span>Rs. {order?.itemsPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Shipping:</span>
            <span>Rs. {order?.shippingPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Tax:</span>
            <span>Rs. {order?.taxPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg">
            <span>Total:</span>
            <span>Rs. {order?.totalPrice.toFixed(2)}</span>
          </div>
          
          {/* Enhanced points earned display */}
          {order && (order.pointsEarned > 0 || order.pointsEarned === 0) && (
            <div className="flex justify-between py-2 text-black mt-2 border-t border-gray-200">
              <span className="font-medium">Reward Points Earned:</span>
              <span className="font-medium">{order.pointsEarned} points</span>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-between ">
          <button className="text-black font-md bg-orange-500 hover:bg-orange-600 rounded-lg px-4 py-2"
           onClick={() => router.push('/profilepage')}>
            Back to Profile
          </button>
          
          
        </div>
      </div>
      <Footer />
    </>
  );
}
