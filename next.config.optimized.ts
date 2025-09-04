import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimize images
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600, // Cache images for 1 hour
  },
  
  // Add cache headers for static assets
  async headers() {
    return [
      {
        source: '/api/customer/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=180, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/api/discounts/product/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/(.*\\.(jpg|jpeg|png|webp|avif|gif|svg))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Compress output
  compress: true,
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react'],
  },
};

export default nextConfig;
