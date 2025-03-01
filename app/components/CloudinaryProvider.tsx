"use client";

import { CloudinaryContext } from 'next-cloudinary';

interface CloudinaryProviderProps {
  children: React.ReactNode;
}

export default function CloudinaryProvider({ children }: CloudinaryProviderProps) {
  return (
    <CloudinaryContext cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}>
      {children}
    </CloudinaryContext>
  );
}
