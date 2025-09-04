"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopBar from "@/app/components/admin/TopBar";
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
  UserIcon,
  CreditCardIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";

interface LineItem {
  quantity: number;
  price_data: {
    currency: string;
    product_data: string;
    unit_amount: number;
  };
  productId?: string;
  metadata: {
    productId: string;
    color: string;
    size: string;
    imageUrl: string;
  };
}

interface Order {
  _id: string;
  userId: string;
  orderNumber: string;
  pointsEarned: number;
  createdAt: string;
  updatedAt: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    emailOffers: boolean;
  };
  shipping: {
    deliveryMethod: string;
    address?: {
      district: string;
      address: string;
      city: string;
      postalCode: string;
    };
  };
  line_items: LineItem[];
  amount: {
    subtotal: number;
    shippingCost: number;
    total: number;
  };
  status: string;
  paymentStatus: string;
  coupon?: {
    code: string;
    discount: number;
    description: string;
  };
  metadata: {
    customerId: string;
  };
}

export default function OrderPage() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          throw new Error("Order ID is required");
        }

        const response = await fetch(`/api/orders/${id}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch order: ${response.status} - ${errorText}`
          );
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }

        const data = await response.json();
        if (!data || !data._id) {
          throw new Error("Invalid order data received");
        }

        setOrder(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load order details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;

    try {
      setUpdatingStatus(true);
      setError("");

      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update order status: ${response.status} - ${errorText}`
        );
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update order status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Delivered":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Processed":
        return "bg-blue-300 text-blue-800 border-blue-200";
      case "Refunded":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex-1">
          <TopBar heading="Order Details" />
          <div className="flex justify-center items-center h-64">
            <div className="text-base md:text-lg text-gray-600">
              Loading order details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex-1">
          <TopBar heading="Order Details" />
          <div className="flex justify-center items-center h-64">
            <div className="text-base md:text-lg text-red-600">
              {error || "Order not found"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex-1">
        <TopBar heading="Order Details" />

        {/* Back Button */}
        <button
          onClick={() => {
            // Force complete page refresh to ensure fresh data
            window.location.href = "/admin/orderlist";
          }}
          className="flex items-center gap-2 mb-6 text-orange-600 hover:text-orange-700 text-base md:text-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Orders
        </button>

        {/* Order Header */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                Order #{order.orderNumber || order._id?.slice(-8) || "Unknown"}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Created: {new Date(order.createdAt).toLocaleDateString()} at{" "}
                {new Date(order.createdAt).toLocaleTimeString()}
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                User ID: {order.userId}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`inline-block px-4 py-2 rounded-full border font-semibold text-sm md:text-base ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </div>
              <div className="mt-2">
                {order.shipping.deliveryMethod === "ship" ? (
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updatingStatus}
                    className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm md:text-base"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                ) : (
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updatingStatus}
                    className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm md:text-base"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Processed">Processed</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
                <UserIcon className="h-8 w-8 text-orange-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 break-words max-w-xs md:max-w-sm">
                  Customer
                </h3>
                <p
                  className="text-gray-600 text-sm md:text-base break-words max-w-xs md:max-w-sm"
                  title={`${order.customer.firstName} ${order.customer.lastName}`}
                >
                  {order.customer.firstName} {order.customer.lastName}
                </p>
                <p
                  className="text-xs md:text-sm text-gray-500 break-all max-w-xs md:max-w-sm"
                  title={order.customer.email}
                >
                  {order.customer.email}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <CreditCardIcon className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800">
                  Total Amount
                </h3>
                <p className="text-xl md:text-2xl font-bold text-orange-600">
                  {order.amount.total.toFixed(2)}
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  Payment: {order.paymentStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TruckIcon className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800">
                  Items
                </h3>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {order.line_items.length}
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  Products ordered
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Items */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingCartIcon className="h-6 w-6 text-orange-500" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.line_items && order.line_items.length > 0 ? (
                order.line_items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    {item.metadata?.imageUrl ? (
                      <img
                        src={item.metadata.imageUrl}
                        alt={item.price_data.product_data}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const nextDiv = e.currentTarget
                            .nextElementSibling as HTMLElement;
                          if (nextDiv) nextDiv.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.metadata?.imageUrl ? "hidden" : ""
                      }`}
                    >
                      <span className="text-gray-500 text-xs md:text-sm">
                        No Image
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-semibold text-base md:text-lg break-words max-w-xs md:max-w-sm"
                        title={item.price_data.product_data}
                      >
                        {item.price_data.product_data}
                      </h4>
                      <p className="text-gray-600 text-sm md:text-base break-words max-w-xs md:max-w-sm">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-gray-600 text-sm md:text-base break-words max-w-xs md:max-w-sm">
                        Color:{" "}
                        {item.metadata?.color
                          ? item.metadata.color.split("/").pop()?.split(".")[0]
                          : "N/A"}{" "}
                        | Size: {item.metadata?.size || "N/A"}
                      </p>
                      <p className="text-orange-600 font-semibold text-sm md:text-base">
                        $
                        {(
                          (item.price_data.unit_amount / 100) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                      <p className="text-xs md:text-sm text-gray-400 break-all max-w-xs md:max-w-sm">
                        Product ID:{" "}
                        {item.metadata?.productId || item.productId || "N/A"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm md:text-base">
                  No items found
                </p>
              )}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm md:text-base">
                  <span>Subtotal:</span>
                  <span>${order.amount.subtotal.toFixed(2)}</span>
                </div>
                {order.coupon && order.coupon.code != null ? (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">
                      Coupon (-{order.coupon?.discount}%)
                    </span>
                    <span className="text-gray-600">
                      -$
                      {(
                        (order.amount.subtotal *
                          (order.coupon?.discount ?? 0)) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm md:text-base">
                  <span>Shipping Cost:</span>
                  <span>${order.amount.shippingCost}</span>
                </div>
                <div className="flex justify-between font-bold text-base md:text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-orange-600">
                    ${order.amount.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Customer Information */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <h2 className="text-lg md:text-xl font-semibold mb-4">
              Shipping Information
            </h2>
            <div className="space-y-2 text-sm md:text-base">
              <p>
                <strong>Delivery Method:</strong>{" "}
                {order.shipping.deliveryMethod}
              </p>
              {order.shipping.address ? (
                <>
                  <p>
                    <strong>Shipping Address:</strong>
                  </p>
                  <p>
                    {order.shipping.address.address}
                    <br />
                    {order.shipping.address.city},{" "}
                    {order.shipping.address.postalCode}
                    <br />
                    {order.shipping.address.district}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">picking-up order</p>
              )}
              <p>
                <strong>Phone:</strong> {order.customer.phone}
              </p>
              <p>
                <strong>Points:</strong> {order.pointsEarned || 0}
              </p>
            </div>

            {/* Order Timeline */}
            <div className="mt-8">
              <h3 className="text-base md:text-lg font-semibold mb-4">
                Order Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm md:text-base">
                      Order Created
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-sm md:text-base">
                        Last Updated
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">
                        {new Date(order.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
