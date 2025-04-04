"use client";
import { useState, useEffect } from "react";
import { FiEdit } from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import { Button, Link, CircularProgress } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReviewButton from "../components/ViewDetailsButtonInReivew";
import ProfilePageToNav from "../components/ProfilePageToNav";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

interface Order {
  _id: string;
  status: string;
  orderItems: {
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  createdAt: string;
  totalPrice: number;
  pointsEarned: number; // Add the pointsEarned field
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  points: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { user } = useAuth();
  const router = useRouter();

  // Fetch user profile and orders
  useEffect(() => {
    const fetchProfileData = async () => {
      // If user is not authenticated, redirect to login
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Fetch user profile
        const profileRes = await fetch('/api/profile');
        if (!profileRes.ok) throw new Error('Failed to fetch profile data');
        
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile({
            firstName: profileData.user.firstName,
            lastName: profileData.user.lastName,
            email: profileData.user.email,
            phone: profileData.user.phone || '',
            address: profileData.user.address || '',
            points: profileData.user.points || 0
          });
        }

        // Fetch user orders
        const ordersRes = await fetch('/api/profile/orders');
        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setOrders(ordersData.orders);
        }
      } catch (err) {
        setError("Failed to load profile data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, router]);

  // Handle edit profile redirect
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

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
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {profile?.firstName} {profile?.lastName} {profile?.points >= 200 && <FaCrown className="text-yellow-500" title="Premium customer" />}
          </h1>
        </div>
        <div className="flex justify-end space-x-6 text-lg font-semibold">
          <Link href="/wishlist" className="hover:underline">
            Wishlist
          </Link>
          <Link href="/payment-options" className="hover:underline">
            Payment Options
          </Link>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg mt-6 shadow-md">
          <h2 className="font-semibold text-lg mb-2">Customer Details</h2>
          <p>
            <strong>Name:</strong> {profile?.firstName} {profile?.lastName}
          </p>
          <p>
            <strong>Email:</strong> {profile?.email}
          </p>
          <p>
            <strong>Phone:</strong> {profile?.phone || 'Not provided'}
          </p>
          <p>
            <strong>Delivery Address:</strong> {profile?.address || 'Not provided'}
          </p>
          <Button className="mt-3 flex items-center gap-2" onClick={handleEditProfile}>
            <FiEdit /> Edit Details
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl">&#x1F4B3;</div>
            <p>Collect coupon to get discounts!</p>
            <Button className="mt-2">Collect</Button>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl">&#x2728;</div>
            <p className="text-3xl font-bold">{profile?.points || 0}</p>
            <p>Reward Points</p>
          </div>
        </div>
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">My Orders</h2>
          <ProfilePageToNav />
        </div>
        
        {orders.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg shadow-md text-center">
            <p className="text-lg">You haven't placed any orders yet.</p>
            <Button 
              variant="contained" 
              className="mt-4"
              onClick={() => router.push('/productlist')}
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-gray-100 p-4 rounded-lg shadow-md mb-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Order #{order._id.substring(0, 8)}</h3>
                <span className="bg-black text-white px-3 py-1 rounded-lg">
                  {order.status}
                </span>
              </div>
              {order.orderItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 mt-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg"
                  />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-lg font-bold">
                      Rs. {item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="ml-auto">Qty: {item.quantity}</p>
                </div>
              ))}
              {order.pointsEarned > 0 && (
                <div className="mt-2">
                  <span className="text-green-600 text-sm font-medium">
                    You earned {order.pointsEarned} reward points from this order!
                  </span>
                </div>
              )}
              <ReviewButton status={order.status} />
              <div className="text-right mt-2">
                <Button 
                  className="text-sm font-semibold hover:underline"
                  onClick={() => router.push(`/orders/${order._id}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <Footer />
    </>
  );
}
