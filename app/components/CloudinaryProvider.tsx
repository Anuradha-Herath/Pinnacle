"use client";

import React, { createContext, useContext } from 'react';

// Define types for Cloudinary context
interface CloudinaryContextType {
  cloudName: string;
  uploadPreset: string;
}

// Create the context with default values
const CloudinaryContext = createContext<CloudinaryContextType>({
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
});

// Custom hook to access the Cloudinary context
export const useCloudinary = () => useContext(CloudinaryContext);

// Props for the CloudinaryProvider component
interface CloudinaryProviderProps {
  children: React.ReactNode;
}

// CloudinaryProvider component
const CloudinaryProvider = ({ children }: CloudinaryProviderProps) => {
  // Configure Cloudinary settings
  const cloudinaryConfig = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  };

  return (
    <CloudinaryContext.Provider value={cloudinaryConfig}>
      {children}
    </CloudinaryContext.Provider>
  );
};

export default CloudinaryProvider;