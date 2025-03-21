"use client";

import { usePathname } from "next/navigation";
import Chatbot from "./Chatbot";

export default function ChatbotWrapper() {
  const pathname = usePathname();
  
  // Debug the actual pathname
  console.log("Current pathname:", pathname);
  
  // Check for admin routes - need to modify the check to match actual URL patterns
  // Admin pages use URL patterns like /productcreate, /customerlist, etc.
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
  
  return <Chatbot />;
}
