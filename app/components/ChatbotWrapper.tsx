"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Chatbot from "./Chatbot";
import PreferencesModal from "./PreferencesModal";
import { useUserPreferences } from "../context/UserPreferencesContext";

export default function ChatbotWrapper() {
  const pathname = usePathname();
  const { preferences } = useUserPreferences();
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  
  // Check if it's a first-time user
  useEffect(() => {
    const hasSeenPreferencesModal = localStorage.getItem("hasSeenPreferencesModal");
    
    // If user hasn't provided any preferences and hasn't seen the modal
    if (!hasSeenPreferencesModal && 
        (!preferences.preferredStyles?.length && 
         !preferences.preferredOccasions?.length && 
         !preferences.preferredColors?.length)) {
      
      // Wait a bit before showing the modal
      const timer = setTimeout(() => {
        setShowPreferencesModal(true);
      }, 5000); // Show after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [preferences]);
  
  // Mark as seen when modal is closed
  const handleClosePreferencesModal = () => {
    localStorage.setItem("hasSeenPreferencesModal", "true");
    setShowPreferencesModal(false);
  };
  
  // Don't render the chatbot if we're in the admin section
  const adminRoutes = [
    '/productcreate',
    '/productlist',
    '/productdetails',
    '/customerlist',
    '/discountedit',
    '/couponedit',
    '/categorydetails',
    '/adminprofile',
    '/adminlogin',
    '/dashboard'
  ];
  
  // Check if the current path is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // If we're on an admin route, don't show the chatbot
  if (isAdminRoute) {
    console.log("Admin route detected, hiding chatbot");
    return null;
  }
  
  return (
    <>
      <Chatbot />
      <PreferencesModal 
        isOpen={showPreferencesModal} 
        onClose={handleClosePreferencesModal} 
      />
    </>
  );
}
