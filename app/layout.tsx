import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from './providers';
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import CloudinaryProvider from "./components/CloudinaryProvider";
import ConditionalProviders from "./components/ConditionalProviders";

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
        <AuthProvider>
          <CloudinaryProvider>
            <Providers>
              <ConditionalProviders>
                {children}
              </ConditionalProviders>
            </Providers>
            <Toaster position="bottom-center" />
          </CloudinaryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
