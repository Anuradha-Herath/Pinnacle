"use client";
import { useState, useEffect } from "react";
import { FiEdit } from "react-icons/fi";
import { Button, CircularProgress } from "@mui/material";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ReviewButton from "../../components/ViewDetailsButtonInReivew";
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
  pointsEarned: number;
  orderNumber: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  
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
            address: profileData.user.address || ''
          });
        }

        // Fetch user orders from the new endpoint
        const ordersRes = await fetch('/api/profile/user-orders');
        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        
        const ordersData = await ordersRes.json();
        console.log("Orders data received:", ordersData); // For debugging
        
        if (ordersData.success) {
          // Orders are already formatted in the API response
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
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {profile?.firstName} {profile?.lastName}
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
                  <h3 className="text-lg font-semibold">
                    Order #{order.orderNumber || order._id.substring(0, 8)}
                  </h3>
                  <span className={`px-3 py-1 rounded-lg text-white ${
                    order.status?.toLowerCase() === 'paid' ? 'bg-green-500' :
                    order.status?.toLowerCase() === 'shipped' ? 'bg-blue-500' :
                    order.status?.toLowerCase() === 'delivered' ? 'bg-orange-500' :
                    order.status?.toLowerCase() === 'refunded' ? 'bg-red-300' :
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

                

                {/* Review button - conditionally show based on status */}
                <ReviewButton status={order.status} />
              </div>
            ))}
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
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
