"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, CircularProgress, Alert } from "@mui/material";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useAuth } from "@/app/context/AuthContext";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture: string;
}

export default function EditProfile() {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profilePicture: "/p9.webp"
  });
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { user } = useAuth();
  const router = useRouter();

  // Fetch current profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        router.push('/login');
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
            phone: data.user.phone || '',
            profilePicture: data.user.profilePicture || '/p9.webp'
          });
        }
      } catch (err) {
        setError("Could not load profile data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, router]);

  // Handle input changes
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
          router.push('/profilepage');
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

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the profile state with new picture URL
        setProfile(prev => ({ ...prev, profilePicture: data.profilePictureUrl }));
        setSuccess('Profile picture updated successfully');
      } else {
        setError(data.error || 'Failed to upload profile picture');
      }
    } catch (err) {
      setError('Error uploading profile picture');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        
        {error && <Alert severity="error" className="mb-4">{error}</Alert>}
        {success && <Alert severity="success" className="mb-4">{success}</Alert>}
        
        <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-lg shadow-md">
          {/* Profile Picture Section */}
          <div className="mb-8 text-center">
            <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-300 border-4 border-gray-300 mx-auto">
                <img
                  src={profile.profilePicture || '/p9.webp'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/p9.webp';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => document.getElementById('profile-picture-input-edit')?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-800 disabled:bg-gray-400"
                title="Change profile picture"
              >
                {uploading ? '...' : '✎'}
              </button>
              <input
                id="profile-picture-input-edit"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Click the edit icon to change your profile picture</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-800 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName "
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                required
                disabled={updating}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-800 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                required
                disabled={updating}
              />
            </div>
          </div>
          
          <div className="mb-8">
            <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
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
            <label htmlFor="phone" className="block text-sm font-medium text-gray-800 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              disabled={updating}
            />
          </div>
          
          <div className="flex justify-end gap-4 mt-8 ">
            <Button 
              variant="outlined" 
              onClick={() => router.back()}
              disabled={updating}
              sx={{ 
                borderColor: 'black', 
                color: 'black',
                '&:hover': { 
                  borderColor: 'black', 
                  backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={updating}
              sx={{ 
                backgroundColor: 'black', 
                color: 'white',
                '&:hover': { 
                  backgroundColor: '#333333' 
                }
              }}
            >
              {updating ? <CircularProgress size={24} /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}
