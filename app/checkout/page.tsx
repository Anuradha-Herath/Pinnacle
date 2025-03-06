"use client";
import { useState, useRef, useEffect } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import Image from "next/image";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import convertToSubcurrency from "../../lib/convertToSubcurrency";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string
);

// Define the form data interface
interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  receiveNews: boolean;
}

function CheckoutForm({
  total,
  formData,
  cartItems,
}: {
  total: number;
  formData: FormData;
  cartItems: any[];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Format product info for Stripe metadata
    const productsInfo = cartItems.map((item) => ({
      id: item.id || "unknown",
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      color: item.color || "N/A",
      size: item.size || "N/A",
      discount: item.discount || 0,
    }));

    // Create a payment intent with all the customer data
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: convertToSubcurrency(total),
        customer: formData,
        products: productsInfo,
      }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [total, formData, cartItems]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(submitError.message);
      setLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?amount=${total}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }

    setLoading(false);
  };

  if (!clientSecret || !stripe || !elements) {
    return (
      <div className="flex items-center justify-center p-6">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-black"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement />
      {errorMessage && <div className="text-red-500 mt-2">{errorMessage}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-6 p-3 bg-black text-white rounded disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : `Pay $ ${total.toFixed(2)}`}
      </button>
    </form>
  );
}

function Checkout() {
  const [shipping, setShipping] = useState("ship");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { cartItems, getCartTotal } = useCart();
  const subtotal = getCartTotal();
  const shippingCost = 10;
  const total = subtotal + shippingCost;
  const placeholderImage = "/placeholder.png";

  // Add form state
  const [formData, setFormData] = useState<FormData>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "United States",
    phone: "",
    receiveNews: false,
  });

  // Form change handler
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Helper function remains the same
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    if (url.trim() === "") return false;

    try {
      if (url.startsWith("/")) return true;
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

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

  // Validate if form is complete
  const isFormComplete = (): boolean => {
    // Basic validation - check if required fields are filled
    const requiredFields = [
      "email",
      "firstName",
      "lastName",
      "address",
      "city",
      "postalCode",
      "phone",
    ];
    return requiredFields.every((field) => formData[field as keyof FormData]);
  };

  return (
    <div>
      <Header />

      <main className="flex flex-col md:flex-row p-8 gap-8 pt-16">
        {/* Left Section: Form */}
        <div className="w-full md:w-4/5 p-8 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Contact</h2>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleFormChange}
            className="w-full p-2 mb-4 border border-gray-500 rounded"
            required
          />
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              name="receiveNews"
              checked={formData.receiveNews}
              onChange={handleFormChange}
            />{" "}
            Email me with news and offers
          </label>

          <h2 className="text-xl font-semibold mb-4">Delivery</h2>
          <div className="flex gap-4 mb-4">
            <div className="p-3 border border-gray-500 rounded-lg bg-white flex items-center gap-2 w-full">
              <input
                type="radio"
                name="delivery"
                checked={shipping === "ship"}
                onChange={() => setShipping("ship")}
              />
              <span>Ship</span>
            </div>
            <div className="p-3 border border-gray-500 rounded-lg bg-white flex items-center gap-2 w-full">
              <input
                type="radio"
                name="delivery"
                checked={shipping === "pickup"}
                onChange={() => setShipping("pickup")}
              />
              <span>Pickup in store</span>
            </div>
          </div>

          <select
            name="country"
            value={formData.country}
            onChange={handleFormChange}
            className="w-full p-2 mb-4 border border-gray-500 rounded"
          >
            <option>Country/Region</option>
            <option>India</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Canada</option>
          </select>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleFormChange}
              className="p-2 border border-gray-500 rounded"
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleFormChange}
              className="p-2 border border-gray-500 rounded"
              required
            />
          </div>

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleFormChange}
            className="w-full p-2 mb-4 border border-gray-500 rounded"
            required
          />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleFormChange}
              className="p-2 border border-gray-500 rounded"
              required
            />
            <input
              type="text"
              name="postalCode"
              placeholder="Postal code"
              value={formData.postalCode}
              onChange={handleFormChange}
              className="p-2 border border-gray-500 rounded"
              required
            />
          </div>
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleFormChange}
            className="w-full p-2 mb-4 border border-gray-500 rounded"
            required
          />

          <h2 className="text-xl font-semibold mb-4">Shipping method</h2>
          <div className="p-3 border border-gray-500 rounded bg-white flex justify-between">
            <span>Standard Shipping</span>
            <span>$ {shippingCost.toFixed(2)}</span>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow-md border border-gray-300 mt-6">
            <h2 className="text-xl font-semibold mb-4">Payment</h2>
            <p className="text-gray-500 mb-2">
              All transactions are secure and encrypted
            </p>

            {/* Stripe Payment Integration with form data */}
            <Elements
              stripe={stripePromise}
              options={{
                mode: "payment",
                amount: convertToSubcurrency(total),
                currency: "usd",
              }}
            >
              <CheckoutForm
                total={total}
                formData={formData}
                cartItems={cartItems}
              />
            </Elements>
          </div>
        </div>

        {/* Right Section: Order Summary */}
        <div className="w-full md:w-2/3 p-6 bg-gray-100 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="mb-4">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => {
                const itemImage = isValidImageUrl(item.image)
                  ? item.image
                  : placeholderImage;
                const itemKey =
                  item.variantKey || item.id || `checkout-item-${index}`;

                return (
                  <div
                    key={itemKey}
                    className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-4"
                  >
                    <div className="relative w-32 h-40">
                      <Image
                        src={itemImage}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                        sizes="128px"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = placeholderImage;
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      {item.color && (
                        <p className="text-sm text-gray-600">
                          Color: {item.color}
                        </p>
                      )}
                      {item.size && (
                        <p className="text-sm text-gray-600">
                          Size: {item.size}
                        </p>
                      )}
                      {item.quantity && (
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      )}
                      {item.discount && (
                        <p className="text-xs text-red-500">
                          Sale {item.discount}% OFF (-Rs{" "}
                          {((item.price * item.discount) / 100).toFixed(2)})
                        </p>
                      )}
                    </div>
                    <span className="ml-auto font-semibold">
                      $ {(item.price * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">
                Your cart is empty
              </p>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Discount code"
              className="flex-1 p-2 border border-gray-200 rounded"
            />
            <button className="p-2 bg-gray-400 text-white rounded w-1/4">
              Apply
            </button>
          </div>
          <div className="flex justify-between font-semibold leading-8 text-lg">
            <span>Sub total </span>
            <span>$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>$ {shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl mt-3">
            <span>Total</span>
            <span>$ {total.toFixed(2)}</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
export default Checkout;
