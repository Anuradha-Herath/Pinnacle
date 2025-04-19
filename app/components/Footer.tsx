import React from "react";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1D1D1D] text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 - About */}
          <div>
            <h3 className="text-lg font-semibold mb-2">About Us</h3>
            <p className="text-gray-400 text-sm">
              Pinnacle is your go-to destination for premium fashion. Explore
              the latest trends and styles.
            </p>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-white">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Follow Us</h3>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                className="text-gray-400 hover:text-white"
              >
                <Facebook size={24} />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                className="text-gray-400 hover:text-white"
              >
                <Instagram size={24} />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                className="text-gray-400 hover:text-white"
              >
                <Twitter size={24} />
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                className="text-gray-400 hover:text-white"
              >
                <Linkedin size={24} />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-6 border-t border-gray-700 pt-4 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Pinnacle. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
