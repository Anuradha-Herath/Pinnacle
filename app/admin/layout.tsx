import { ReactNode } from 'react';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // This layout specifically for admin routes
  // It will prevent the main ConditionalProviders from loading Cart/Wishlist
  console.log('Admin layout loaded - bypassing cart/wishlist providers');
  return <>{children}</>;
}