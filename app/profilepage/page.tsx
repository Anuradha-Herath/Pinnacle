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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

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

        // Only fetch orders for regular users, not for admins
        if (user.role !== 'admin') {
          const ordersRes = await fetch('/api/profile/orders');
          if (!ordersRes.ok) throw new Error('Failed to fetch orders');
          
          const ordersData = await ordersRes.json();
          if (ordersData.success) {
            setOrders(ordersData.orders);
          }
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

  // Calculate pagination values
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  // Change page handler
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      // Scroll to top of orders section for better UX
      document.getElementById("orders-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

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
        {/* Basic profile information - shown to all users */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {profile?.firstName} {profile?.lastName} 
            {user?.role !== 'admin' && (profile?.points ?? 0) >= 200 && 
              <FaCrown className="text-yellow-500" title="Premium customer" />
            }
          </h1>

        </div>

        {/* Basic customer details - shown to all users */}
        <div className="bg-gray-100 p-4 rounded-lg mt-6 shadow-md">
          <h2 className="font-semibold text-lg mb-2">Profile Details</h2>
          <p>
            <strong>Name:</strong> {profile?.firstName} {profile?.lastName}
          </p>
          <p>
            <strong>Email:</strong> {profile?.email}
          </p>
          <p>
            <strong>Phone:</strong> {profile?.phone || 'Not provided'}
          </p>
          <button className="mt-3 flex items-center gap-2 text-orange-500" onClick={handleEditProfile}>
            <FiEdit /> Edit Details
          </button>
        </div>

        {/* Customer-specific content - only shown if user role is not admin */}
        {user?.role !== 'admin' && (
          <>
            {/* Links section */}
            <div className="flex justify-end space-x-6 text-lg font-semibold mt-8 ">
              <a href="/wishlist" className="hover:underline text-orange-500">
                Wishlist
              </a>
              <a href="/payment-options" className="hover:underline text-orange-500">
                Payment Options
              </a>
            </div>

            {/* Rewards & Coupons section */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
                <div className="text-2xl">&#x1F4B3;</div>
                <p>Collect coupon to get discounts!</p>
                <button className="mt-2 text-orange-500 text-md hover:underline">Collect</button>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
                <div className="text-2xl">&#x2728;</div>
                <p className="text-3xl font-bold">{profile?.points || 0}</p>
                <p>Reward Points</p>
              </div>
            </div>

            {/* Orders section with pagination */}
            <div className="mt-10" id="orders-section">
              <h2 className="text-2xl font-bold mb-4">My Orders</h2>
              
            </div>
            
            {orders.length === 0 ? (
              <div className="bg-gray-100 p-8 rounded-lg shadow-md text-center">
                <p className="text-lg">You haven't placed any orders yet.</p>
                <Button 
                  variant="contained" 
                  className="mt-4"
                  onClick={() => router.push('/')}
                >
                  Start Shopping
                </Button>
              </div>
            ) : (
              <>
                {currentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-gray-100 p-4 rounded-lg shadow-md mb-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Order #{order._id.substring(0, 8)}</h3>
                      <span 
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          order.status === "Order Confirmed"
                            ? "bg-blue-300 text-blue-800"
                            : order.status === "Order Completed" || order.status === "Delivered"
                            ? "bg-green-300 text-green-800"
                            : order.status === "Out For Delivery"
                            ? "bg-orange-300 text-orange-800"
                            : order.status === "Shipping"
                            ? "bg-cyan-300 text-cyan-800"
                            : order.status === "Processing"
                            ? "bg-yellow-300 text-yellow-800"
                            : "bg-gray-700 text-white"
                        }`}
                      >
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
                        <span className="text-black text-sm font-medium">
                          You earned {order.pointsEarned} reward points from this order!
                        </span>
                      </div>
                    )}
                  
                    <div className="text-right mt-2">
                      <button 
                        className="text-md bg-orange-500  px-4 py-2 rounded-lg hover:bg-orange-600"
                        onClick={() => router.push(`/orders/${order._id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pagination controls - only show if there are multiple pages */}
                {totalPages > 1 && (
                  <div className="flex justify-end my-6">
                    <div className="flex items-center border rounded-md overflow-hidden shadow-md">
                      <button 
                        className="px-4 py-2 border-r bg-white hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      
                      {/* Page number buttons */}
                      {[...Array(totalPages)].map((_, index) => (
                        <button 
                          key={index}
                          className={`px-4 py-2 ${
                            currentPage === index + 1 
                              ? 'bg-orange-500 text-white font-semibold' 
                              : 'border-x bg-white hover:bg-gray-200'
                          }`}
                          onClick={() => paginate(index + 1)}
                        >
                          {index + 1}
                        </button>
                      ))}
                      
                      <button 
                        className="px-4 py-2 border-l bg-white hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Admin-specific content */}
        {user?.role === 'admin' && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
            <h2 className="font-semibold text-lg mb-4">Admin Options</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="contained" 
                onClick={() => router.push('/admin/dashboard')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Admin Dashboard
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => router.push('/admin/settings')}
              >
                Admin Settings
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
