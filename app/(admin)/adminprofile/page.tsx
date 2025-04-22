"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";
import { FiEdit } from "react-icons/fi";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Define the profile interface
interface AdminProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  profilePicture?: string;
  createdAt?: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [useRegularLayout, setUseRegularLayout] = useState<boolean>(false);

  // Check login source to determine layout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loginSource = localStorage.getItem('adminLoginSource');
      setUseRegularLayout(loginSource === 'regular');
      
      // For debugging
      console.log("Admin login source:", loginSource);
    }
  }, []);

  useEffect(() => {
    // Ensure only admins can access this page
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      router.push('/profilepage');
      return;
    }

    const fetchAdminProfile = async () => {
      try {
        // Use the same API endpoint as the regular profile page
        const res = await fetch('/api/profile');
        if (!res.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await res.json();
        if (data.success) {
          setProfile({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            phone: data.user.phone || 'Not provided',
            address: data.user.address || 'Not provided',
            profilePicture: data.user.profilePicture || '/p9.webp',
            createdAt: data.user.createdAt
          });
          // Update timestamp when profile data changes
          setTimestamp(Date.now());
        } else {
          throw new Error(data.error || 'Failed to fetch profile');
        }
      } catch (err) {
        console.error("Error fetching admin profile:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, [user, router]);

  // Format date for better display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
  };
  
  // Handle edit profile - make sure this path is correct
  const handleEditProfile = () => {
    router.push('/profile/edit'); // This is correct, don't change it
  };

  // Simple loading state
  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen flex-1 bg-gray-50 p-6">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen flex-1 bg-gray-50 p-6">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6">
            <div className="text-red-500 text-lg mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="px-10 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate when the last login was (placeholder for now)
  const lastLoginDate = new Date();
  lastLoginDate.setDate(lastLoginDate.getDate() - 2); // Mock: 2 days ago

  // Main content with conditional layout
  if (useRegularLayout) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Profile Card */}
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-60 flex items-center justify-center relative" style={{ backgroundImage: 'url(/profilebackground.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute -bottom-12">
                <div className="h-40 w-40 rounded-full relative overflow-hidden border-4 border-white">
                  <Image 
                    src={`${profile?.profilePicture || '/p9.webp'}?t=${timestamp}`}
                    alt="Profile" 
                    width={160} 
                    height={160}
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/p9.webp';
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex p-10 pt-20">
              <div className="w-1/2 text-left">
                <h2 className="text-2xl font-semibold pb-4">{profile?.firstName} {profile?.lastName}</h2>
                <p className="text-lg text-gray-600 leading-relaxed"><strong>Email:</strong><br /> {profile?.email}</p>
                <p className="text-lg text-gray-600 leading-relaxed"><strong>Phone:</strong><br /> {profile?.phone}</p>
                <button className="mt-3 flex items-center gap-2 text-orange-500" onClick={handleEditProfile}>
                  <FiEdit /> Edit Details
                </button>
              </div>
              <div className="w-px bg-white mx-10 pr-20"></div>
              <div className="w-1/2 text-right pr-20 flex flex-col justify-end">
                <p className="text-left text-lg text-gray-600"><strong>Address:</strong><br /> {profile?.address}</p>
                <p className="text-left text-lg text-gray-600"><strong>Registration Date:</strong> <br />{formatDate(profile?.createdAt)}</p>
                <p className="text-left text-lg text-gray-600"><strong>Last Login Date:</strong><br /> {formatDate(lastLoginDate.toISOString())}</p>
              </div>
            </div>
            
            <div className="p-8 flex justify-end">
              <button 
                onClick={() => router.push('/admin/dashboard')} 
                className="px-10 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Admin Dashboard
              </button>
              <button 
                onClick={() => router.back()} 
                className="px-10 py-4 bg-gray-300 text-gray-700 rounded-lg ml-4"
              >
                BACK
              </button>
            </div>
          </div>

          {/* Admin Options Section */}
          <div className="mt-6 bg-white p-6 rounded-lg shadow-lg max-w-5xl mx-auto">
            <h2 className="font-semibold text-lg mb-4">Admin Options</h2>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => router.push('/admin/dashboard')}
                className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => router.push('/admin/settings')}
                className="px-6 py-3 border border-orange-500 text-orange-500 bg-white rounded-md hover:bg-orange-50"
              >
                Settings
              </button>
              <button 
                onClick={() => router.push('/admin/orderlist')}
                className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
                Manage Orders
              </button>
              <button 
                onClick={() => router.push('/admin/productlist')}
                className="px-6 py-3 border border-orange-500 text-orange-500 bg-white rounded-md hover:bg-orange-50"
              >
                Manage Products
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Default admin layout with sidebar
  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-600">Admin's Profile</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={() => router.push("/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>
            
            <div className="p-1 rounded-full border-2 border-gray-300">
              <img 
                src={`${profile?.profilePicture || '/p9.webp'}?t=${timestamp}`} 
                alt="Profile" 
                className="h-8 w-8 rounded-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/p9.webp';
                }}
              />
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-60 flex items-center justify-center relative" style={{ backgroundImage: 'url(/profilebackground.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute -bottom-12">
              <div className="h-40 w-40 rounded-full relative overflow-hidden border-4 border-white">
                <Image 
                  src={`${profile?.profilePicture || '/p9.webp'}?t=${timestamp}`}
                  alt="Profile" 
                  width={160} 
                  height={160}
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/p9.webp';
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex p-10 pt-20">
            <div className="w-1/2 text-left">
              <h2 className="text-2xl font-semibold pb-4">{profile?.firstName} {profile?.lastName}</h2>
              <p className="text-lg text-gray-600 leading-relaxed"><strong>Email:</strong><br /> {profile?.email}</p>
              <p className="text-lg text-gray-600 leading-relaxed"><strong>Phone:</strong><br /> {profile?.phone}</p>
              <button className="mt-3 flex items-center gap-2 text-orange-500" onClick={handleEditProfile}>
                <FiEdit /> Edit Details
              </button>
            </div>
            <div className="w-px bg-white mx-10 pr-20"></div>
            <div className="w-1/2 text-right pr-20 flex flex-col justify-end">
              <p className="text-left text-lg text-gray-600"><strong>Address:</strong><br /> {profile?.address}</p>
              <p className="text-left text-lg text-gray-600"><strong>Registration Date:</strong> <br />{formatDate(profile?.createdAt)}</p>
              <p className="text-left text-lg text-gray-600"><strong>Last Login Date:</strong><br /> {formatDate(lastLoginDate.toISOString())}</p>
            </div>
          </div>
          
          <div className="p-8 flex justify-end">
            <button 
              onClick={() => router.push('/admin/dashboard')} 
              className="px-10 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Admin Dashboard
            </button>
            <button 
              onClick={() => router.back()} 
              className="px-10 py-4 bg-gray-300 text-gray-700 rounded-lg ml-4"
            >
              BACK
            </button>
          </div>
        </div>

        {/* Admin Options Section */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="font-semibold text-lg mb-4">Admin Options</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/admin/dashboard')}
              className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => router.push('/admin/settings')}
              className="px-6 py-3 border border-orange-500 text-orange-500 bg-white rounded-md hover:bg-orange-50"
            >
              Settings
            </button>
            <button 
              onClick={() => router.push('/admin/orderlist')}
              className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Manage Orders
            </button>
            <button 
              onClick={() => router.push('/admin/productlist')}
              className="px-6 py-3 border border-orange-500 text-orange-500 bg-white rounded-md hover:bg-orange-50"
            >
              Manage Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
