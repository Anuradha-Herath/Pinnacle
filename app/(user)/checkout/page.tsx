"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { useCart, CartItem } from "../../context/CartContext";
import { getValidImageUrl, handleImageError } from "@/lib/imageUtils";
import Success from "@/app/components/checkout/Success";
import Cancel from "@/app/components/checkout/Cancel";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

function Checkout() {
  const [shipping, setShipping] = useState("ship");
  const [isClient, setIsClient] = useState(false);
  const { cart, getCartTotal, isLoading, clearCart } = useCart();
  const cartClearedRef = useRef(false);
  const pointsProcessedRef = useRef(false);
  const router = useRouter();

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<{
    code: string;
    discount: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    emailOffers: false,
    deliveryMethod: "ship",
    district: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });

  // Handle cart clearing only once
  useEffect(() => {
    if (isClient && !cartClearedRef.current) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("success") === "1") {
        (async () => {
          try {
            console.log("Success parameter detected, clearing cart");
            cartClearedRef.current = true;

            await clearCart();
            console.log("Cart cleared successfully after payment");
          } catch (error) {
            console.error("Error clearing cart:", error);
          }
        })();
      }
    }
  }, [isClient, clearCart]);

  // Handle points processing only once
  useEffect(() => {
    if (isClient && !pointsProcessedRef.current) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("success") === "1") {
        const orderNumber = searchParams.get("order");
        if (orderNumber) {
          pointsProcessedRef.current = true;
          handlePoints(orderNumber);
        }
      }
    }
  }, [isClient]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleDeliveryMethodChange = (method: string) => {
    setShipping(method);
    setFormData((prev) => ({
      ...prev,
      deliveryMethod: method,
    }));
  };

  // Handle coupon code validation
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode,
          subtotal: getCartTotal(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCouponError(data.error || "Invalid coupon code");
        setCouponData(null);
      } else {
        setCouponData(data.coupon);
        toast.success(`Coupon applied: ${data.coupon.description}`);
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      setCouponError("Error validating coupon. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    setCouponError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Creating an object with all the form data
    const checkoutData = {
      ...formData,
      cart: cart,
      subtotal: getCartTotal(),
      shippingCost: shipping === "ship" ? 10 : 0,
      coupon: couponData,
      discountAmount: couponData ? couponData.discountAmount : 0,
      total: calculateTotal(),
    };

    console.log("Submitting checkout data:", checkoutData);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      // Special handling for authentication errors
      if (response.status === 401) {
        console.log("Authentication required");
        toast.error("Please log in to complete your purchase");
        // Redirect to login page after a brief delay
        setTimeout(() => {
          router.push("/login");
        }, 1500);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Checkout successful:", data);

      // Storing line items in session storage
      if (data.line_items) {
        sessionStorage.setItem(
          "checkout_line_items",
          JSON.stringify(data.line_items)
        );
      }

      // Redirect to the specified page in the response or default to payment
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        window.location.href = "/payment";
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        "There was a problem processing your checkout. Please try again."
      );
    }
  };

  const handlePoints = async (orderNumber: string | null) => {
    try {
      const response = await fetch("/api/orders/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber: orderNumber }), // Replace with actual order number
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add points");
      }

    } catch (error) {
      console.error("Error adding points:", error);
    }
  }

  // Fix for hydration issues - only render cart after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate total with discount
  const calculateTotal = () => {
    const subtotal = getCartTotal();
    const shippingCost = shipping === "ship" ? 10 : 0;
    const discountAmount = couponData ? couponData.discountAmount : 0;
    return subtotal + shippingCost - discountAmount;
  };

  const getDisplayColorName = (color?: string): string => {
    if (!color) return "Default";

    if (color.startsWith("http") || color.startsWith("/")) {
      const parts = color.split("/");
      const fileName = parts[parts.length - 1];
      return fileName.split(".")[0].replace(/-|_/g, " ");
    }

    return color;
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Checking URL parameters for success or cancel
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("success") === "1"
  ) {
    const orderNumber = new URLSearchParams(window.location.search).get(
      "order"
    );
    return <Success orderNumber={orderNumber || "N/A"} />;
  } else if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("canceled") === "1"
  ) {
    return <Cancel />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Checkout</h1>

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-4 sm:gap-8">
          {/* Checkout Form - left, 50% width on desktop */}
          <div className="lg:col-span-6 order-1 lg:order-1 w-full">
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 h-full flex flex-col">
              <form onSubmit={handleSubmit}>
                {/* ... (form sections remain unchanged) ... */}
                <section className="mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">
                    Contact Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                        required
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        name="emailOffers"
                        checked={formData.emailOffers}
                        onChange={handleCheckboxChange}
                        className="rounded text-black focus:ring-black"
                      />
                      Email me with news and special offers
                    </label>
                  </div>
                </section>

                {/* Delivery Method */}
                <section className="mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">
                    Delivery Method
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <label
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
                        shipping === "ship"
                          ? "border-black bg-gray-50"
                          : "border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="ship"
                        className="text-black focus:ring-black"
                        checked={shipping === "ship"}
                        onChange={() => handleDeliveryMethodChange("ship")}
                      />
                      <div>
                        <p className="font-medium">Ship to Address</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Delivery in 3-5 business days
                        </p>
                      </div>
                    </label>
                    <label
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
                        shipping === "pickup"
                          ? "border-black bg-gray-50"
                          : "border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="pickup"
                        className="text-black focus:ring-black"
                        checked={shipping === "pickup"}
                        onChange={() => handleDeliveryMethodChange("pickup")}
                      />
                      <div>
                        <p className="font-medium">Pickup in Store</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Usually ready in 24 hours
                        </p>
                      </div>
                    </label>
                  </div>
                </section>

                {/* Shipping Address */}
                {shipping === "ship" && (
                  <section className="mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                      Shipping Address
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="district"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          District
                        </label>
                        <select
                          id="district"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                          required={shipping === "ship"}
                        >
                          <option value="">Select District</option>
                          {/* <option value="IN">India</option>
                          <option value="US">United States</option>
                          <option value="UK">United Kingdom</option>
                          <option value="CA">Canada</option> */}
                          <option value="Jaffna">Jaffna</option>
                          <option value="Kilinochchi">Kilinochchi</option>
                          <option value="Mannar">Mannar</option>
                          <option value="Mullaitivu">Mullaitivu</option>
                          <option value="Vavuniya">Vavuniya</option>
                          <option value="Kurunegala">Kurunegala</option>
                          <option value="Puttalam">Puttalam</option>
                          <option value="Colombo">Colombo</option>
                          <option value="Gampaha">Gampaha</option>
                          <option value="Kalutara">Kalutara</option>
                          <option value="Anuradhapura">Anuradhapura</option>
                          <option value="Polonnaruwa">Polonnaruwa</option>
                          <option value="Kandy">Kandy</option>
                          <option value="Matale">Matale</option>
                          <option value="Nuwara Eliya">Nuwara Eliya</option>
                          <option value="Kegalle">Kegalle</option>
                          <option value="Ratnapura">Ratnapura</option>
                          <option value="Ampara">Ampara</option>
                          <option value="Batticaloa">Batticaloa</option>
                          <option value="Trincomalee">Trincomalee</option>
                          <option value="Badulla">Badulla</option>
                          <option value="Monaragala">Monaragala</option>
                          <option value="Galle">Galle</option>
                          <option value="Hambantota">Hambantota</option>
                          <option value="Matara">Matara</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="firstName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            First Name
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                            required={shipping === "ship"}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="lastName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                            required={shipping === "ship"}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="address"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Address
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                          required={shipping === "ship"}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="city"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            City
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                            required={shipping === "ship"}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="postalCode"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Postal Code
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                            required={shipping === "ship"}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                          required={shipping === "ship"}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Pickup Information */}
                {shipping === "pickup" && (
                  <section className="mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">
                      Pickup Information
                    </h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="pickup-firstName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            First Name
                          </label>
                          <input
                            type="text"
                            id="pickup-firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="pickup-lastName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="pickup-lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="pickup-phone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="pickup-phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                          required
                          placeholder="We'll contact you when your order is ready"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          We'll send you a email when your order is ready for
                          pickup
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Shipping Method */}
                <section className="mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">
                    Shipping Method
                  </h2>

                  {shipping === "ship" ? (
                    <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="standard"
                          checked
                          readOnly
                          className="text-black focus:ring-black"
                        />
                        <span>Standard Shipping</span>
                      </div>
                      <span className="font-medium">$10.00</span>
                    </label>
                  ) : (
                    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="pickupMethod"
                            checked
                            readOnly
                            className="text-black focus:ring-black"
                          />
                          <span>Store Pickup</span>
                        </div>
                        <span className="font-medium text-green-600">Free</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 ml-6">
                        Pick up your order at our flagship store. Please bring
                        valid e-receipt ,we sent to your e-mail for
                        verification.
                      </p>
                      <div className="mt-3 ml-6 p-3 bg-gray-100 rounded-md">
                        <p className="text-xs sm:text-sm font-medium">
                          Pinnacle Flagship Store
                        </p>
                        <p className="text-xs text-gray-500">
                          123 Fashion Avenue, Main Street
                        </p>
                        <p className="text-xs text-gray-500">
                          Open: Mon-Sat, 10:00 AM - 9:00 PM
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white font-medium rounded-md hover:bg-gray-900 transition"
                >
                  Continue to Payment
                </button>

                <div className="mt-6 text-center">
                  <Link
                    href="/cart"
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Return to cart
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary - right, 50% width on desktop */}
          <div className="lg:col-span-6 order-2 lg:order-2 w-full">
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 lg:mb-0 h-full flex flex-col">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 pb-2 border-b">
                Order Summary
              </h2>

              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p>Loading your order...</p>
                </div>
              ) : cart && cart.length > 0 ? (
                <div className="mb-6 pr-2">
                  {cart.map((item: CartItem, index: number) => (
                    <div
                      key={`${item.id}-${item.size}-${item.color}-${index}`}
                      className="flex items-start gap-3 sm:gap-4 border-b border-gray-100 py-3 sm:py-4"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded flex-shrink-0 overflow-hidden">
                        <img
                          src={getValidImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={handleImageError}
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <div className="mt-1 text-xs sm:text-sm text-gray-500 space-y-1 break-words">
                          {item.color && (
                            <p>Color: {getDisplayColorName(item.color)}</p>
                          )}
                          {item.size && <p>Size: {item.size}</p>}
                          <p>Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="font-medium text-gray-900 text-xs sm:text-base whitespace-nowrap">
                        {item.discountedPrice !== undefined ? (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <p className="text-xs text-gray-500 line-through">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <span className="text-gray-900">
                              $
                              {(item.discountedPrice * item.quantity).toFixed(
                                2
                              )}
                            </span>
                          </div>
                        ) : (
                          <>${(item.price * item.quantity).toFixed(2)}</>
                        )}{" "}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">Your cart is empty</p>
                  <Link
                    href="/cart"
                    className="text-black underline mt-2 inline-block"
                  >
                    Return to cart
                  </Link>
                </div>
              )}

              <div className="mt-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!couponData || isApplyingCoupon}
                  />
                  {couponData ? (
                    <button
                      onClick={removeCoupon}
                      type="button"
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={validateCoupon}
                      type="button"
                      disabled={isApplyingCoupon}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition"
                    >
                      {isApplyingCoupon ? "Applying..." : "Apply"}
                    </button>
                  )}
                </div>
                {couponError && (
                  <p className="mt-2 text-sm text-red-600">{couponError}</p>
                )}
                {couponData && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">{couponData.code}</span>:{" "}
                      {couponData.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
                {couponData && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">
                      Discount ({couponData.discount}%)
                    </span>
                    <span className="font-medium text-green-600">
                      -${couponData.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {shipping === "ship" ? (
                  <>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">$10.00</span>
                    </div>
                    <div className="flex justify-between py-3 text-base sm:text-lg font-semibold border-t border-gray-200 mt-2">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-3 text-base sm:text-lg font-semibold border-t border-gray-200 mt-2">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Checkout;
