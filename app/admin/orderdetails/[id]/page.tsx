"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import { BellIcon, Cog6ToothIcon, ClockIcon, CheckCircleIcon, TruckIcon, CubeIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          throw new Error(data.error || 'Failed to fetch order data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  // Function to format dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ready":
        return "bg-green-300 text-green-800";
      case "Packaging":
        return "bg-yellow-300 text-yellow-800";
      default:
        return "bg-gray-300 text-gray-800";
    }
  };

  // Function to get payment card image
  const getPaymentCardImage = (method: string) => {
    switch (method) {
      case "MasterCard":
        return "/mastercard-logo.png";
      case "Visa":
        return "/visa-logo.png";
      default:
        return "/default-card-logo.png";
    }
  };

  // Function to get progress bar color based on order status
  const getProgressBarColor = (step: string) => {
    const statusOrder = ["pending", "processing", "shipped", "out for delivery", "delivered"];
    const currentStatus = order?.status?.toLowerCase() || "";
    const currentStepIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(step.toLowerCase());

    if (stepIndex <= currentStepIndex) {
      switch (step.toLowerCase()) {
        case "pending":
          return "bg-green-500";
        case "processing":
          return "bg-yellow-500";
        case "shipped":
          return "bg-cyan-500";
        case "out for delivery":
          return "bg-orange-500";
        case "delivered":
          return "bg-blue-500";
        default:
          return "bg-gray-300";
      }
    } else {
      return "bg-gray-300";
    }
  };

  // Function to get timeline icon
  const getTimelineIcon = (icon: string) => {
    switch (icon) {
      case "packing":
        return <CubeIcon className="h-6 w-6 text-orange-500" />;
      case "payment":
        return <CheckCircleIcon className="h-6 w-6 text-orange-500" />;
      case "confirmed":
        return <ShieldCheckIcon className="h-6 w-6 text-orange-500" />;
      case "shipping":
        return <TruckIcon className="h-6 w-6 text-orange-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex flex-col items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error loading order</p>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => router.push("/admin/orderlist")}
            className="mt-4 px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
          >
            Back to Order List
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">Order not found</p>
            <button 
              onClick={() => router.push("/admin/orderlist")}
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
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
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Order Details</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>
            {/* Profile */}
            <button onClick={() => router.push("/admin/profilepage")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="w-3/5">
            {/* Order Header */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h2 className="text-lg font-semibold">#{order.orderNumber}</h2>
              <p className="text-gray-600">Order / Order Details / #{order.orderNumber} - {formatDate(order.createdAt)}</p>

              {/* Progress Bar */}
              <div className="flex gap-8 mt-4">
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("pending")}`}></div>
                  <span className="text-gray-400 mt-2">Order Confirmed</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("processing")}`}></div>
                  <span className="text-gray-400 mt-2">Processing</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("shipped")}`}></div>
                  <span className="text-gray-400 mt-2">Shipping</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("out for delivery")}`}></div>
                  <span className="text-gray-400 mt-2">Out For Delivery</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("delivered")}`}></div>
                  <span className="text-gray-400 mt-2">Delivered</span>
                </div>
              </div>

              <p className="text-gray-600 mt-4">
                <strong>Estimated Shipping Date:</strong> {order.estimatedShipping ? formatDate(order.estimatedShipping) : 'Not available'}
              </p>

              <div className="mt-4 flex gap-4">
                <button className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400">Undo</button>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">Make As Ready To Ship</button>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 pr-40">Product</th>
                    <th className="p-3 pr-12">Status</th>
                    <th className="p-3 pr-8">Quantity</th>
                    <th className="p-3 pr-8">Unit Price</th>
                    <th className="p-3 pr-8">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.line_items && order.line_items.map((item: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-3 flex items-center gap-2">
                        <img 
                          src={item.metadata?.imageUrl || "/placeholder-product.png"} 
                          alt={item.price_data?.product_data || "Product"} 
                          className="w-10 h-10 rounded-md" 
                        />
                        {item.price_data?.product_data} {item.metadata?.size && `Size-${item.metadata.size}`} {item.metadata?.color && item.metadata.color}
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 pl-4">{item.quantity}</td>
                      <td className="p-3">${(item.price_data?.unit_amount / 100).toFixed(2)}</td>
                      <td className="p-3">${((item.price_data?.unit_amount * item.quantity) / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Timeline */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
              {order.timeline && order.timeline.length > 0 ? (
                order.timeline.map((event: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 border-b py-2">
                    <div className="flex-shrink-0">
                      {getTimelineIcon(event.icon)}
                    </div>
                    <div className="flex-1">
                      <p>{event.event} - <strong>{event.confirmedBy}</strong></p>
                      <p className="text-gray-600">{formatDate(event.date)} {format(new Date(event.date), 'hh:mm a')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No timeline events available.</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="w-2/5">
            {/* Order Summary */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <p>Sub Total: ${(order.amount.subtotal / 100).toFixed(2)}</p>
                <p>Discount: ${order.amount.discount ? (order.amount.discount / 100).toFixed(2) : "0.00"}</p>
                <p>Delivery Charge: ${(order.amount.shippingCost / 100).toFixed(2)}</p>
                <p>Estimated Tax: ${order.amount.tax ? (order.amount.tax / 100).toFixed(2) : "0.00"}</p>
                <p className="font-semibold">Total Amount: ${(order.amount.total / 100).toFixed(2)}</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6 h-40">
              <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
              <div className="gap-4">
                {order.paymentResult?.method && (
                  <img
                    src={getPaymentCardImage(order.paymentResult.method)}
                    alt={order.paymentResult.method}
                    className="w-12 h-8 object-contain"
                  />
                )}
                <p>{order.paymentResult?.method || "Payment method not available"} {order.paymentResult?.last4Digits && `(**** ${order.paymentResult.last4Digits})`}</p>
                <p>Payment Status: {order.paymentStatus}</p>
                {order.paymentResult?.id && <p>Payment Id: {order.paymentResult.id}</p>}
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-12">
              <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
              <img
                src="/p9.webp"
                alt="Customer Profile"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex items-center gap-4">
                <div>
                  <p>Name: {order.customer.firstName} {order.customer.lastName}</p><br />
                  <p>Email: {order.customer.email}</p><br />
                  <p>Contact Number: {order.customer.phone}</p>
                </div>
              </div>
              <p className="mt-4">Shipping Address: {
                order.shipping.deliveryMethod === "ship" ? 
                `${order.shipping.address.address}, ${order.shipping.address.city}, ${order.shipping.address.postalCode}, ${order.shipping.address.country}` : 
                "In-store pickup"
              }</p><br />
              <p>Delivery Method: {order.shipping.deliveryMethod === "ship" ? "Standard Shipping" : "In-store Pickup"}</p>
            </div>

            {/* Back Button */}
            <div className="mt-36 flex gap-4 pl-96">
              <button
                onClick={() => router.push("/admin/orderlist")}
                className="px-8 py-3 bg-gray-300 text-black rounded-md hover:bg-gray-400"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
