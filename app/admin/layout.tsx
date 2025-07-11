"use client";

import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "react-hot-toast";

// Lightweight admin layout that only includes essential providers
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="bottom-center" />
    </AuthProvider>
  );
}
