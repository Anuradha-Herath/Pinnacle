"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { CircularProgress } from "@mui/material";
import { useAuth } from "@/app/context/AuthContext";
import withAuth from "../../components/withAuth";

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registrationDate: string;
  lastLogin: string;
  profileImage?: string;
}

function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch admin user data
    const fetchAdminProfile = async () => {
      try {
        // Wait a bit for auth context to stabilize
        if (user === undefined) {
          // Auth context is still loading, don't redirect yet
          return;
        }

        // Check if user is authenticated and is an admin
        if (!user) {
          console.log('No user found, redirecting to login');
          setError('No user found, redirecting to login');
          router.push('/admin/adminlogin');
          return;
        }

        if (user.role !== 'admin') {
          console.log('User is not admin, redirecting to home');
          setError(' User is not an admin, redirecting to login');
          router.push('/admin/adminlogin');
          return;
        }

        // Fetch profile data from API
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch admin profile data');
        }

        const data = await response.json();
        
        if (data.success) {
          // Format the user data
          setAdminUser({
            _id: data.user._id,
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            email: data.user.email || '',
            phone: data.user.phone || 'Not provided',
            registrationDate: new Date(data.user.createdAt || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            lastLogin: new Date(data.user.lastLogin || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            profileImage: data.user.profileImage || '/download.jpg'
          });
        } else {
          throw new Error(data.error || 'Failed to fetch profile data');
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        setError('Failed to load admin profile data');
      } finally {
        // Only set loading to false if we have determined the user state
        if (user !== undefined) {
          setLoading(false);
        }
      }
    };

    fetchAdminProfile();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex justify-center items-center">
          <CircularProgress 
            sx={{ 
              color: 'orange',
              '& .MuiCircularProgress-circle': {
                stroke: 'orange'
              }
            }} 
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex justify-center items-center">
          <div className="text-red-500 text-center">
            <p className="text-xl mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-600">Admin's Profile</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/admin/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={() => router.push("/admin/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>
            
            <button onClick={() => router.push("/admin/adminprofile")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-60 flex items-center justify-center relative" style={{ backgroundImage: 'url(/profilebackground.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute -bottom-12">
              <Image 
                src={adminUser?.profileImage || "/download.jpg"} 
                alt="Profile" 
                width={80} 
                height={80} 
                className="h-40 w-40 rounded-full object-cover" 
              />
            </div>
          </div>
          <div className="flex p-10 pt-20">
            <div className="w-1/2 text-left">
              <h2 className="text-3xl font-semibold pb-4">
                {adminUser?.firstName} {adminUser?.lastName}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                <strong>Email:</strong><br /> {adminUser?.email}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                <strong>Phone:</strong><br /> {adminUser?.phone}
              </p>
            </div>
            <div className="w-px bg-white mx-10 pr-20"></div>
            <div className="w-1/2 text-right pr-20 flex flex-col justify-end ">
              <p className="text-left text-lg text-gray-600 mb-8">
                <strong>Registration Date:</strong> <br />{adminUser?.registrationDate}
              </p>
              <p className="text-left text-lg text-gray-600">
                <strong>Last Login Date:</strong><br /> {adminUser?.lastLogin}
              </p>
            </div>
          </div>
          
          <div className="p-8 flex justify-end">
            <button 
              onClick={() => router.push("/admin/adminprofile/profileedit")}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 ">
              EDIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export with admin authentication protection
export default withAuth(ProfilePage, {
  requireAdmin: true,
  redirectTo: '/admin/adminlogin'
});
