"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, ChevronDown } from "react-feather";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { useCart, CartItem } from "../../context/CartContext";
import { getValidImageUrl, handleImageError } from "@/lib/imageUtils";
import { useRouter } from "next/navigation";

function Checkout() {
  const [shipping, setShipping] = useState("ship");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { cart, getCartTotal, isLoading, clearCart } = useCart();
  const router = useRouter();
  const cartClearedRef = useRef(false);

  const [formData, setFormData] = useState({
    email: "",
    emailOffers: false,
    deliveryMethod: "ship",
    country: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Creating an object with all the form data
    const checkoutData = {
      ...formData,
      cart: cart,
      subtotal: getCartTotal(),
      shippingCost: shipping === "ship" ? 650 : 0,
      total: shipping === "ship" ? getCartTotal() + 650 : getCartTotal(),
    };

    console.log("Submitting checkout data:", checkoutData);

    fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
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
      })
      .catch((error) => {
        console.error("Checkout error:", error);
        alert(
          "There was a problem processing your checkout. Please try again."
        );
      });
  };

  // Fix for hydration issues - only render cart after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMouseEnter = (category: string) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    setOpenDropdown(category);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
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

  // Checking URL parameters directly in the render function for success message
  const isSuccess =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("success") === "1";

  if (isSuccess) {
    const orderNumber = new URLSearchParams(window.location.search).get(
      "order"
    );
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="m-3 flex items-center justify-center bg-gray-50">
          <div className="p-6 bg-white rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Success!</h1>
            <p className="text-lg text-gray-700">
              Payment successful! Your order number is {orderNumber}.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition"
            >
              Go to Homepage
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
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
                      className="flex items-start gap-4 border-b border-gray-100 py-4"
                    >
                      <div className="w-20 h-20 bg-gray-50 rounded flex-shrink-0 overflow-hidden">
                        <img
                          src={getValidImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={handleImageError}
                        />
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <div className="mt-1 text-sm text-gray-500 space-y-1">
                          {item.color && (
                            <p>Color: {getDisplayColorName(item.color)}</p>
                          )}
                          {item.size && <p>Size: {item.size}</p>}
                          <p>Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="font-medium text-gray-900">
                      {item.discountedPrice !== undefined ? (
                          <div className="flex items-center gap-2">
                             <p className="text-xs text-gray-500 line-through">${(item.price * item.quantity).toFixed(2)}</p>
                            <span className="text-gray-900">${(item.discountedPrice * item.quantity).toFixed(2)}</span>
                           
                          </div>
                        ) : (
                          <>${(item.price * item.quantity).toFixed(2)}</>
                        )}                      </div>
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Discount code"
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                  />
                  <button className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition">
                    Apply
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
                {shipping === "ship" ? (
                  <>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">$650.00</span>
                    </div>
                    <div className="flex justify-between py-3 text-lg font-semibold border-t border-gray-200 mt-2">
                      <span>Total</span>
                      <span>${(getCartTotal() + 650).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-3 text-lg font-semibold border-t border-gray-200 mt-2">
                      <span>Total</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit}>
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">
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
                  <h2 className="text-xl font-semibold mb-4">
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
                        <p className="text-sm text-gray-500">
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
                        <p className="text-sm text-gray-500">
                          Usually ready in 24 hours
                        </p>
                      </div>
                    </label>
                  </div>
                </section>

                {/* Shipping Address */}
                {shipping === "ship" && (
                  <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                      Shipping Address
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="country"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Country/Region
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                          required={shipping === "ship"}
                        >
                          <option value="">Select Country</option>
                          <option value="IN">India</option>
                          <option value="US">United States</option>
                          <option value="UK">United Kingdom</option>
                          <option value="CA">Canada</option>
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
                    <h2 className="text-xl font-semibold mb-4">
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
                          We'll send you a text message when your order is ready
                          for pickup
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Shipping Method */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">
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
                      <span className="font-medium">$650.00</span>
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
                      <p className="text-sm text-gray-500 ml-6">
                        Pick up your order at our flagship store. Please bring a
                        valid ID for verification.
                      </p>
                      <div className="mt-3 ml-6 p-3 bg-gray-100 rounded-md">
                        <p className="text-sm font-medium">
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

                <input
                  type="hidden"
                  name="cartItems"
                  value={JSON.stringify(cart)}
                />
                <input
                  type="hidden"
                  name="subtotal"
                  value={getCartTotal().toString()}
                />
                <input
                  type="hidden"
                  name="total"
                  value={(shipping === "ship"
                    ? getCartTotal() + 650
                    : getCartTotal()
                  ).toString()}
                />

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
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Checkout;
