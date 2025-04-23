"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, CircularProgress, Alert } from "@mui/material";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useAuth } from "@/app/context/AuthContext";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export default function EditProfile() {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: ""
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
            address: data.user.address || ''
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
          phone: profile.phone,
          address: profile.address
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <TextField
              label="First Name"
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
              fullWidth
              required
              disabled={updating}
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={profile.lastName}
              onChange={handleChange}
              fullWidth
              required
              disabled={updating}
            />
          </div>
          
          <TextField
            label="Email"
            name="email"
            value={profile.email}
            fullWidth
            disabled={true} // Email cannot be changed
            className="mb-4"
          />
          
          <TextField
            label="Phone Number"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            fullWidth
            className="mb-4"
            disabled={updating}
          />
          
          <TextField
            label="Delivery Address"
            name="address"
            value={profile.address}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            className="mb-4"
            disabled={updating}
          />
          
          <div className="flex justify-end gap-4 mt-6">
            <Button 
              variant="outlined" 
              onClick={() => router.back()}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              color="primary"
              disabled={updating}
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
