"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar"; // Import the Sidebar component
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
          
          if (data.user.profilePicture) {
            setImagePreview(data.user.profilePicture);
          }
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

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes('image/')) {
      setError("Please upload an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      // Create form data to handle file upload
      const formData = new FormData();
      formData.append('firstName', profile.firstName);
      formData.append('lastName', profile.lastName);
      formData.append('phone', profile.phone);
      
      // Add profile picture if there's a file
      if (fileInputRef.current?.files?.[0]) {
        formData.append('profilePicture', fileInputRef.current.files[0]);
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess("Profile updated successfully");
        // Wait a bit to show success message before redirecting
        setTimeout(() => {
          // Redirect admins to adminprofile, regular users to profilepage
          if (user?.role === 'admin') {
            router.push('/adminprofile');
          } else {
            router.push('/profilepage');
          }
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
    // For admin, use Sidebar layout even during loading
    if (user?.role === 'admin') {
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
    
    // For regular users, keep the original layout
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
        <Footer />
      </>
    );
  }

  // Main content with different layouts based on user role
  if (user?.role === 'admin') {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen flex-1 bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
                <p>{success}</p>
              </div>
            )}
            
            {/* The form content stays the same */}
            <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-lg shadow-md" encType="multipart/form-data">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
                  <Image 
                    src={imagePreview || profile.profilePicture || '/p9.webp'}
                    alt="Profile" 
                    fill
                    sizes="128px"
                    className="object-cover"
                    priority
                  />
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-picture"
                />
                
                <label 
                  htmlFor="profile-picture"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 cursor-pointer mb-2"
                >
                  Choose Profile Picture
                </label>
                
                <p className="text-xs text-gray-700">Maximum size: 5MB. Supported formats: JPG, PNG, GIF.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    disabled={updating}
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
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
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  disabled={true}
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
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
              
              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => router.back()}
                  disabled={updating}
                  className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updating}
                  className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                >
                  {updating ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </div>
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // For regular users, keep the original layout
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
            <p>{success}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-lg shadow-md" encType="multipart/form-data">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
              <Image 
                src={imagePreview || profile.profilePicture || '/p9.webp'}
                alt="Profile" 
                fill
                sizes="128px"
                className="object-cover"
                priority
              />
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="profile-picture"
            />
            
            <label 
              htmlFor="profile-picture"
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 cursor-pointer mb-2"
            >
              Choose Profile Picture
            </label>
            
            <p className="text-xs text-gray-700">Maximum size: 5MB. Supported formats: JPG, PNG, GIF.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                disabled={updating}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
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
          
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              disabled={true}
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
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
          
          <div className="flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => router.back()}
              disabled={updating}
              className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={updating}
              className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {updating ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </div>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}
