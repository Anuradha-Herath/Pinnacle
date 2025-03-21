"use client";

import { usePathname } from "next/navigation";
import Chatbot from "./Chatbot";

export default function ChatbotWrapper() {
  const pathname = usePathname();
  
  // Don't render the chatbot if we're in the admin section
  // Admin routes are in the (admin) route group
  if (pathname.includes('/(admin)') || pathname.startsWith('/admin')) {
    return null;
  }
  
  return <Chatbot />;
}
