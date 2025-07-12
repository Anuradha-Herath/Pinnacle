import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from './providers';
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";
import { DiscountProvider } from "./context/DiscountContext";
import { Toaster } from "react-hot-toast";
import CloudinaryProvider from "./components/CloudinaryProvider";
import ChatbotWrapper from "./components/ChatbotWrapper"; // Changed from Chatbot to ChatbotWrapper
import AuthProviders from "./providers/AuthProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pinnacle - Premium Fashion",
  description: "Fashion for all occasions",
};

// Add script to handle fetch polyfill for Edge browser
const EdgeCompatibilityScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        // Edge browser fetch polyfill
        if (typeof window !== 'undefined' && !window.fetch) {
          console.log('Fetch API not supported, loading polyfill...');
          // You can add a fetch polyfill here if needed
        }
        
        // Ensure AbortController is available
        if (typeof window !== 'undefined' && !window.AbortController) {
          console.log('AbortController not supported');
        }
      `,
    }}
  />
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <EdgeCompatibilityScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProviders>
          <AuthProvider>
            <DiscountProvider>
              <WishlistProvider>
                <CartProvider>
                  <CloudinaryProvider>
                    <Providers>
                      {children}
                    </Providers>
                    <Toaster position="bottom-center" />
                    <ChatbotWrapper /> {/* Using the wrapper instead of direct Chatbot */}
                  </CloudinaryProvider>
                </CartProvider>
              </WishlistProvider>
            </DiscountProvider>
          </AuthProvider>
        </AuthProviders>
      </body>
    </html>
  );
}
