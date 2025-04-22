"use client";
import React, { useState, useEffect } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface TopBarProps {
  title: string; // Custom title for each page
}

const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const router = useRouter();
  const { user } = useAuth();

  // Add state for profile picture and timestamp
  const [profilePicture, setProfilePicture] = useState<string>('/p9.webp');
  const [timestamp, setTimestamp] = useState<number>(Date.now());

  // Fetch profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await fetch('/api/profile?t=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user.profilePicture) {
            setProfilePicture(data.user.profilePicture);
            // Update timestamp when profile picture changes
            setTimestamp(Date.now());
          }
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePicture();
  }, []);

  return (
    <div className="bg-gray-50 p-4 flex justify-between items-center">
      {/* Page Title - Passed as a prop */}
      <h1 className="text-2xl font-semibold">{title}</h1>

      {/* Top-Right Icons */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button onClick={() => router.push("/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>

        {/* Settings */}
        <button onClick={() => router.push("/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
        </button>

        {/* Order History / Activity Log */}
        <button onClick={() => router.push("/history")} className="p-2 hover:bg-gray-200 rounded-lg">
          <ClockIcon className="h-6 w-6 text-gray-600" />
        </button>

        {/* Profile */}
        <button
          onClick={() => router.push( "/admin/adminprofile" )}
          className="p-1 rounded-full border-2 border-gray-300"
        >
          <img
            src={`${profilePicture}?t=${timestamp}`}
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
            }}
          />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
