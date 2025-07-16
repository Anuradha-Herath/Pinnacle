"use client";
import { useState, useEffect } from "react";
import { GiCrown } from "react-icons/gi";
import { Button, CircularProgress } from "@mui/material";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
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
  subtotal: number;
  shippingCost: number;
  pointsEarned: number;
  orderNumber: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  points: number;
  profilePicture: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false); // Flag to prevent repeated API calls
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  
  const { user } = useAuth();
  const router = useRouter();

  // Function to get crown color based on points
  const getCrownColor = (points: number) => {
    if (points >= 1000) return "text-yellow-500"; // Gold/Yellow
    if (points >= 500) return "text-gray-400"; // Silver
    return "text-black"; // Black
  };

  // Fetch user profile and orders
  useEffect(() => {
    const fetchProfileData = async () => {
      // If user is not authenticated, redirect to login
      if (!user) {
        router.push('/login');
        return;
      }

      // If data is already loaded, don't fetch again
      if (dataLoaded) {
        setLoading(false);
        return;
      }

      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        // Fetch user profile with caching headers
        const profileRes = await fetch('/api/profile', {
          headers: {
            'Cache-Control': 'max-age=300', // Cache for 5 minutes
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!profileRes.ok) throw new Error('Failed to fetch profile data');
        
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile({
            firstName: profileData.user.firstName,
            lastName: profileData.user.lastName,
            email: profileData.user.email,
            phone: profileData.user.phone || '',
            address: profileData.user.address || '',
            points: profileData.user.points || 0,
            profilePicture: profileData.user.profilePicture || '/p9.webp'
          });
        }

        // Fetch user orders from the new endpoint with caching
        const ordersController = new AbortController();
        const ordersTimeoutId = setTimeout(() => ordersController.abort(), 15000);
        
        const ordersRes = await fetch('/api/profile/user-orders', {
          headers: {
            'Cache-Control': 'max-age=300', // Cache for 5 minutes
          },
          signal: ordersController.signal,
        });
        
        clearTimeout(ordersTimeoutId);
        
        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        
        const ordersData = await ordersRes.json();
        console.log("Orders data received:", ordersData); // For debugging
        
        if (ordersData.success) {
          // Orders are already formatted in the API response
          setOrders(ordersData.orders);
        }

        // Mark data as loaded
        setDataLoaded(true);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError("Request timed out. Please try again.");
        } else {
          setError("Failed to load profile data");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have a user and haven't loaded data yet
    if (user && !dataLoaded) {
      fetchProfileData();
    } else if (user && dataLoaded) {
      // If we have user and data is loaded, just set loading to false
      setLoading(false);
    }
  }, [user?.id, dataLoaded]); // Removed router from dependencies to prevent unnecessary re-renders

  // Handle edit profile redirect
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  // Calculate pagination values
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  // Function to handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll back to top of orders section
    document.getElementById('orders-section')?.scrollIntoView({ behavior: 'smooth' });
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
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-300 border-2 border-gray-300">
            <img
              src={profile?.profilePicture || '/p9.webp'}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/p9.webp';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {profile?.firstName} {profile?.lastName}
            {profile && (
              <GiCrown 
                className={`ml-2 text-6xl ${getCrownColor(profile.points)}`}
                title={`Points: ${profile.points} - ${
                  profile.points >= 1000 ? 'Gold Crown' : 
                  profile.points >= 500 ? 'Silver Crown' : 
                  'Bronze Crown'
                }`}
              />
            )}
          </h1>
        </div>
        
        <div className=" p-4 rounded-lg mt-6 shadow-md bg-gray-100">
          <div>
          <h2 className="font-semibold text-2xl mb-2">Customer Details</h2>
          <p>
            <strong>Name:</strong> {profile?.firstName} {profile?.lastName}
          </p>
          <p>
            <strong>Email:</strong> {profile?.email}
          </p>
          <p>
            <strong>Phone:</strong> {profile?.phone || 'Not provided'}
          </p>
          </div>

          <div>
          <button className="text-white bg-black px-4 py-2 rounded-md mt-4 hover:bg-gray-800" 
            onClick={() => router.push('/profile/edit')}
            > Edit Details
          </button>
          </div>
        </div>

        <div className="flex justify-center mt-6 mb-6">
          <div className="bg-gray-200 rounded-lg p-6 text-center shadow-md">
            <p className="text-black font-bold text-lg">Total points: {profile?.points || 0}</p>
          </div>
        </div>
        
        <div id="orders-section" className="mt-10">
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
            {/* Display only current page orders */}
            {currentOrders.map((order) => (
              <div
                key={order._id}
                className="bg-gray-100 p-4 rounded-lg shadow-md mb-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Order #{order.orderNumber || order._id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on: {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-white ${
                    order.status?.toLowerCase() === 'paid' ? 'bg-green-500' :
                    order.status?.toLowerCase() === 'shipped' ? 'bg-blue-500' :
                    order.status?.toLowerCase() === 'delivered' ? 'bg-orange-500' :
                    order.status?.toLowerCase() === 'refunded' ? 'bg-red-500' :
                    order.status?.toLowerCase() === 'processing' ? 'bg-yellow-500 text-gray-300' : 
                    'bg-gray-600'
                  }`}>
                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase() : 'Processing'}
                  </span>
                </div>

                {/* Order items - handle both structures */}
                {Array.isArray(order.orderItems) && order.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 mt-4">
                    <img
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-lg font-bold">
                        Rs. {typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    <p className="ml-auto">Qty: {item.quantity}</p>
                  </div>
                ))}

                {/* Order Summary */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Subtotal:</p>
                      <p className="text-sm font-semibold">
                        Rs. {typeof order.subtotal === 'number' ? order.subtotal.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Shipping Cost:</p>
                      <p className="text-sm font-semibold">
                        Rs. {typeof order.shippingCost === 'number' ? order.shippingCost.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <p className="text-lg font-bold text-black">Total:</p>
                      <p className="text-lg font-bold text-black">
                        Rs. {typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    {order.pointsEarned > 0 && (
                      <div className="flex justify-between items-center pt-1">
                        <p className="text-sm text-black font-semibold">Points Earned:</p>
                        <p className="text-sm text-black font-semibold">{order.pointsEarned}</p>
                      </div>
                    )}
                  </div>
                </div>

                

                {/* Remove the ReviewButton component - customers will go directly to review page */}
                
              </div>
            ))}
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2 ">
                <Button 
                  variant="outlined"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  sx={{ 
                    borderColor: 'black', 
                    color: 'black',
                    '&:hover': { 
                      borderColor: 'black', 
                      backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                    }
                  }}
                >
                  Previous
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <Button
                    key={number}
                    variant={currentPage === number ? "contained" : "outlined"}
                    onClick={() => handlePageChange(number)}
                    sx={
                      currentPage === number 
                        ? { 
                            backgroundColor: 'black', 
                            color: 'white',
                            '&:hover': { backgroundColor: '#333333' }
                          } 
                        : { 
                            borderColor: 'black', 
                            color: 'black',
                            '&:hover': { 
                              borderColor: 'black', 
                              backgroundColor: 'rgba(8, 8, 8, 0.04)' 
                            }
                          }
                    }
                  >
                    {number}
                  </Button>
                ))}
                
                <Button 
                  variant="outlined"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  sx={{ 
                    borderColor: 'black', 
                    color: 'black',
                    '&:hover': { 
                      borderColor: 'black', 
                      backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                    }
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
