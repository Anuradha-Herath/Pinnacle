"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, CircularProgress, Alert } from "@mui/material";
import Sidebar from "../../../components/Sidebar";
import { useAuth } from "@/app/context/AuthContext";

interface AdminProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function AdminProfileEdit() {
  const [profile, setProfile] = useState<AdminProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { user } = useAuth();
  const router = useRouter();

  // Fetch current profile data
  useEffect(() => {
    const fetchProfile = async () => {
      // Wait a bit for auth context to stabilize
      if (user === undefined) {
        // Auth context is still loading, don't redirect yet
        return;
      }

      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      if (user.role !== 'admin') {
        console.log('User is not admin, redirecting to home');
        router.push('/');
        return;
      }

      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        
        const data = await res.json();
        if (data.success) {
          setProfile({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            phone: data.user.phone || ''
          });
        }
      } catch (err) {
        setError("Could not load profile data");
        console.error(err);
      } finally {
        // Only set loading to false if we have determined the user state
        if (user !== undefined) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user, router]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess("Profile updated successfully");
        // Wait a bit to show success message before redirecting
        setTimeout(() => {
          router.push('/admin/adminprofile');
        }, 2000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An error occurred while updating your profile");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

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

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        <h1 className="text-2xl font-semibold text-gray-700 mb-6">Edit Admin Profile</h1>
        
        {error && <Alert severity="error" className="mb-4">{error}</Alert>}
        {success && <Alert severity="success" className="mb-4">{success}</Alert>}
        
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div >
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-800 mb-5">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 "
                required
                disabled={updating}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-800 mb-5">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                disabled={updating}
              />
            </div>
          </div>
          
          <div className="mb-8">
            <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-5">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              disabled={true} // Email cannot be changed
            />
          </div>
          
          <div className="mb-8">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-800 mb-5">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={updating}
            />
          </div>
          
          <div className="flex justify-end gap-4 mt-12">
            <Button 
              variant="outlined" 
              onClick={() => router.back()}
              disabled={updating}
              color="warning"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              color="warning"
              disabled={updating}
            >
              {updating ? <CircularProgress size={24} sx={{ color: 'white' }} /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
