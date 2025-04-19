"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircleIcon, TruckIcon, XCircleIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../../components/Sidebar";

// Define necessary interfaces
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

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  customer?: CustomerInfo;
  user?: string;
  paymentMethod: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  pointsEarned: number;
  deliveryMethod?: 'shipping' | 'pickup'; // Add this missing property
}

export default function AdminOrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("Order ID is missing");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch order: ${res.status}`);
        }
        
        const data = await res.json();
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
  }, [orderId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Out For Delivery":
        return "bg-orange-100 text-orange-800";
      case "Shipped":
      case "Shipping":
        return "bg-blue-100 text-blue-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    setStatusUpdateLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update order status');
      }
      
      const data = await res.json();
      if (data.success) {
        setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen flex-1 bg-gray-50 p-6">
          <div className="flex justify-center items-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen flex-1 bg-gray-50 p-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={() => router.push('/admin/orderlist')}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Back to Order List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen flex-1 bg-gray-50 p-6">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Order Details</h1>
            <p className="text-gray-500">Order #{order?.orderNumber || (order?._id.substring(0, 8))}</p>
          </div>
          
          
        </div>

        {/* Order Status and Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Order Status</h2>
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadgeColor(order?.status || '')}`}>
                {order?.status}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-3 py-2 bg-yellow-700 text-white rounded-md hover:bg-yellow-800 disabled:opacity-50"
                onClick={() => updateOrderStatus('Processing')}
                disabled={statusUpdateLoading || order?.status === 'Processing'}
              >
                Mark as Processing
              </button>
              <button 
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                onClick={() => updateOrderStatus('Shipping')}
                disabled={statusUpdateLoading || order?.status === 'Shipping'}
              >
                Mark as Shipping
              </button>
              <button 
                className="px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                onClick={() => updateOrderStatus('Out For Delivery')}
                disabled={statusUpdateLoading || order?.status === 'Out For Delivery'}
              >
                Mark as Out For Delivery
              </button>
              <button 
                className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                onClick={() => updateOrderStatus('Delivered')}
                disabled={statusUpdateLoading || order?.status === 'Delivered'}
              >
                Mark as Delivered
              </button>
              <button 
                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                onClick={() => updateOrderStatus('Cancelled')}
                disabled={statusUpdateLoading || order?.status === 'Cancelled'}
              >
                Cancel Order
              </button>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Payment Info</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium">{order?.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${order?.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order?.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {order?.customer?.firstName} {order?.customer?.lastName}</p>
              <p><span className="font-medium">Email:</span> {order?.customer?.email}</p>
              <p><span className="font-medium">Phone:</span> {order?.shippingAddress?.phone}</p>
              <p><span className="font-medium">Registered User:</span> {order?.user ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          {/* Shipping Information */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Recipient:</span> {order?.shippingAddress?.fullName}</p>
              <p><span className="font-medium">Address:</span> {order?.shippingAddress?.address}</p>
              <p><span className="font-medium">City:</span> {order?.shippingAddress?.city}, {order?.shippingAddress?.postalCode}</p>
              <p><span className="font-medium">Country:</span> {order?.shippingAddress?.country}</p>
              <p><span className="font-medium">Delivery Method:</span> {order?.deliveryMethod || 'Standard Shipping'}</p>
            </div>
          </div>
          
          {/* Order Information */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Order Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Order Date:</span> {order?.createdAt && formatDate(order.createdAt)}</p>
              <p><span className="font-medium">Last Update:</span> {order?.updatedAt && formatDate(order.updatedAt)}</p>
              {order?.pointsEarned && order.pointsEarned > 0 && (
                <p className="text-green-600">
                  <span className="font-medium">Reward Points:</span> {order.pointsEarned} points earned
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="bg-white p-4 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order?.orderItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-16 w-16 mr-4 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="h-16 w-16 rounded object-cover" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="text-sm text-gray-500">
                            {item.size && <p>Size: {item.size}</p>}
                            {item.color && <p>Color: {item.color}</p>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">Rs. {item.price.toFixed(2)}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium">Rs. {(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-medium">Subtotal:</td>
                  <td className="px-4 py-3 text-left font-medium">Rs. {order?.itemsPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-medium">Shipping:</td>
                  <td className="px-4 py-3 text-left font-medium">Rs. {order?.shippingPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-medium">Tax:</td>
                  <td className="px-4 py-3 text-left font-medium">Rs. {order?.taxPrice.toFixed(2)}</td>
                </tr>
                <tr className="bg-gray-100">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total:</td>
                  <td className="px-4 py-3 text-left font-semibold">Rs. {order?.totalPrice.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end mt-6">
          <button 
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 mr-2"
            onClick={() => router.push('/admin/orderlist')}
          >
            Back to Order List
          </button>
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            onClick={() => window.print()}
          >
            Print Order
          </button>
        </div>
      </div>
    </div>
  );
}