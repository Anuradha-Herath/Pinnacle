import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#262626] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Information */}
          <div>
            <h3 className="text-xl font-serif italic mb-4">Pinnacle</h3>
            <p className="text-sm text-gray-300 mb-4">
              Premium clothing and accessories for the modern lifestyle.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          {/* Shop Links */}
          <div>
            <h3 className="text-lg font-medium mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/category/Men" className="hover:text-orange-400">Men</Link></li>
              <li><Link href="/category/Women" className="hover:text-orange-400">Women</Link></li>
              <li><Link href="/category/Accessories" className="hover:text-orange-400">Accessories</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-orange-400">New Arrivals</Link></li>
              <li><Link href="/sale" className="hover:text-orange-400">Sale</Link></li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-medium mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/contact" className="hover:text-orange-400">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-orange-400">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-orange-400">Shipping & Returns</Link></li>
              <li><Link href="/privacy" className="hover:text-orange-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-orange-400">Terms & Conditions</Link></li>
            </ul>
          </div>
          
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center">
                <MapPin size={16} className="mr-2" />
                <span>123 Fashion Street, City, Country</span>
              </li>
              <li className="flex items-center">
                <Phone size={16} className="mr-2" />
                <span>+12 (345) 678-9000</span>
              </li>
              <li className="flex items-center">
                <Mail size={16} className="mr-2" />
                <span>support@pinnacle.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Pinnacle. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
