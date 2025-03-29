"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon, ClockIcon, CheckCircleIcon, TruckIcon, CubeIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

export default function OrderDetailsPage() {
  const router = useRouter();

  // Dummy order details
  const order = {
    orderId: "#538765",
    createdAt: "April 09, 2024",
    estimatedShipping: "April 25, 2024",
    status: "Processing", // Can be "Order Confirmed", "Processing", "Shipping", "Out For Delivery", "Delivered"
    items: [
      { name: "Black Astro Tee Size-M", status: "Ready", quantity: 1, price: 89.0, image: "/cap2.webp" },
      { name: "Pink Relax Tee Size-S", status: "Packaging", quantity: 1, price: 89.0, image: "/cap2.webp" },
      { name: "Brown Classic Tee Size-M", status: "Ready", quantity: 1, price: 89.0, image: "/cap2.webp" },
      { name: "Trucker Cap Size-NS", status: "Ready", quantity: 1, price: 89.0, image: "/cap2.webp" },
    ],
    totalAmount: 750.0,
    discount: 60.89,
    tax: 34.89,
    paymentId: "#MN768139059",
    customer: {
      name: "Gastom Lapierre",
      email: "hello@dundermufflin.com",
      contact: "(723) 345-8495",
      shippingAddress: "Wemco Avenue Ltd, 13456 International Road, Texas, USA",
      billingAddress: "Same As The Shipping Address",
      profilePhoto: "/customer-profile.jpg", // Add customer profile photo
    },
    payment: {
      method: "MasterCard", // Can be "MasterCard" or "Visa"
      transactionId: "#MN768139059",
      last4Digits: "7812",
    },
    timeline: [
      { event: "The Packing Has Been Started", confirmedBy: "Gastom Lapier", date: "April 23, 2024, 09:40 AM", icon: "packing" },
      { event: "Order Payment", confirmedBy: "Using MasterCard", date: "April 23, 2024, 09:40 AM", icon: "payment" },
      { event: "Order Is Confirmed", confirmedBy: "Gastom Lapier", date: "April 23, 2024, 09:40 AM", icon: "confirmed" },
    ],
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
        return "/mastercard-logo.png"; // Path to MasterCard logo
      case "Visa":
        return "/visa-logo.png"; // Path to Visa logo
      default:
        return "/default-card-logo.png"; // Default card logo
    }
  };

  // Function to get progress bar color based on order status
  const getProgressBarColor = (step: string) => {
    const statusOrder = ["Order Confirmed", "Processing", "Shipping", "Out For Delivery", "Delivered"];
    const currentStepIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(step);

    if (stepIndex <= currentStepIndex) {
      switch (step) {
        case "Order Confirmed":
          return "bg-green-500"; // Green for Order Confirmed
        case "Processing":
          return "bg-yellow-500"; // Yellow for Processing
        case "Shipping":
          return "bg-cyan-500"; // Light blue for Shipping
        case "Out For Delivery":
          return "bg-orange-500"; // Orange for Out For Delivery
        case "Delivered":
          return "bg-blue-500"; // Blue for Delivered
        default:
          return "bg-gray-300"; // Default gray
      }
    } else {
      return "bg-gray-300"; // Gray for incomplete steps
    }
  };

  // Function to get timeline icon
  const getTimelineIcon = (icon: string) => {
    switch (icon) {
      case "packing":
        return <CubeIcon className="h-6 w-6 text-orange-500" />; // Icon for packing
      case "payment":
        return <CheckCircleIcon className="h-6 w-6 text-orange-500" />; // Icon for payment
      case "confirmed":
        return <ShieldCheckIcon className="h-6 w-6 text-orange-500" />; // Icon for confirmation
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />; // Default icon
    }
  };

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

        {/* Main Content (Left Side) */}
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="w-3/5">
            {/* Order Header */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h2 className="text-lg font-semibold">#{order.orderId}</h2>
              <p className="text-gray-600">Order / Order Details / #{order.orderId} - {order.createdAt}</p>

              {/* Progress Bar */}
              <div className="flex gap-8 mt-4">
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("Order Confirmed")}`}></div>
                  <span className="text-gray-400 mt-2">Order Confirmed</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("Processing")}`}></div>
                  <span className="text-gray-400 mt-2">Processing</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("Shipping")}`}></div>
                  <span className="text-gray-400 mt-2">Shipping</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("Out For Delivery")}`}></div>
                  <span className="text-gray-400 mt-2">Out For Delivery</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-2 rounded-md ${getProgressBarColor("Delivered")}`}></div>
                  <span className="text-gray-400 mt-2">Delivered</span>
                </div>
              </div>

              <p className="text-gray-600 mt-4">
                <strong>Estimated Shipping Date:</strong> {order.estimatedShipping}
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
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3 flex items-center gap-2">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md" />
                        {item.name}
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 pl-4">{item.quantity}</td>
                      <td className="p-3">${item.price.toFixed(2)}</td>
                      <td className="p-3">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Timeline */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
              {order.timeline.map((event, index) => (
                <div key={index} className="flex items-center gap-4 border-b py-2">
                  <div className="flex-shrink-0">
                    {getTimelineIcon(event.icon)}
                  </div>
                  <div className="flex-1">
                    <p>{event.event} - <strong>{event.confirmedBy}</strong></p>
                    <p className="text-gray-600">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="w-2/5">
            {/* Order Summary */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <p>Sub Total: ${order.totalAmount.toFixed(2)}</p>
                <p>Discount: -${order.discount.toFixed(2)}</p>
                <p>Delivery Charge: $90.00</p>
                <p>Estimated Tax: ${order.tax.toFixed(2)}</p>
                <p className="font-semibold">Total Amount: ${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6 h-40">
              <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
              <div className="  gap-4">
                <img
                  src={getPaymentCardImage(order.payment.method)}
                  alt={order.payment.method}
                  className="w-12 h-8 object-contain"
                />
                <p>{order.payment.method} (**** {order.payment.last4Digits})</p>
                <p>Payment Id: {order.paymentId}</p>
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
                  <p>Name: {order.customer.name}</p><br />
                  <p>Email: {order.customer.email}</p><br />
                  <p>Contact Number: {order.customer.contact}</p>
                </div>
              </div>
              <p className="mt-4">Shipping Address: {order.customer.shippingAddress}</p><br />
              <p>Billing Address: {order.customer.billingAddress}</p>
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