import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from './providers';
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";
import { UserPreferencesProvider } from "./context/UserPreferencesContext";
import { Toaster } from "react-hot-toast";
import CloudinaryProvider from "./components/CloudinaryProvider";
import ChatbotWrapper from "./components/ChatbotWrapper"; // Changed from Chatbot to ChatbotWrapper

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <UserPreferencesProvider>
                <CloudinaryProvider>
                  <Providers>
                    {children}
                  </Providers>
                  <Toaster position="bottom-right" />
                  <ChatbotWrapper /> {/* Using the wrapper instead of direct Chatbot */}
                </CloudinaryProvider>
              </UserPreferencesProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
