"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DebugPage() {
  const { user, syncUserData } = useAuth();
  const [localCart, setLocalCart] = useState<string>('');
  const [localWishlist, setLocalWishlist] = useState<string>('');
  const [serverCart, setServerCart] = useState<string>('');
  const [serverWishlist, setServerWishlist] = useState<string>('');
  
  // Load data from localStorage and server
  useEffect(() => {
    // Load from localStorage
    const cart = localStorage.getItem('cart') || '[]';
    const wishlist = localStorage.getItem('wishlist') || '[]';
    setLocalCart(cart);
    setLocalWishlist(wishlist);
    
    // Load from server if logged in
    if (user) {
      fetchUserData();
    }
  }, [user]);
  
  const fetchUserData = async () => {
    try {
      // Fetch cart
      const cartResponse = await fetch('/api/user/cart');
      if (cartResponse.ok) {
        const cartData = await cartResponse.json();
        setServerCart(JSON.stringify(cartData.cart || [], null, 2));
      }
      
      // Fetch wishlist
      const wishlistResponse = await fetch('/api/user/wishlist');
      if (wishlistResponse.ok) {
        const wishlistData = await wishlistResponse.json();
        setServerWishlist(JSON.stringify(wishlistData.wishlist || [], null, 2));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const handleSync = async () => {
    await syncUserData();
    await fetchUserData();
    alert('Sync completed. Data refreshed.');
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Data Debug</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <div className="bg-white p-2 rounded border">
          {user ? (
            <div>
              <p><span className="font-medium">Logged in as:</span> {user.firstName} {user.lastName}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Role:</span> {user.role}</p>
              <p><span className="font-medium">User ID:</span> {user.id}</p>
            </div>
          ) : (
            <p>Not logged in (guest mode)</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">Local Storage Data</h2>
          
          <div className="mb-4">
            <h3 className="font-medium">Cart</h3>
            <pre className="bg-white p-2 rounded border overflow-auto max-h-60 text-xs">
              {localCart ? JSON.stringify(JSON.parse(localCart), null, 2) : 'No cart found'}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium">Wishlist</h3>
            <pre className="bg-white p-2 rounded border overflow-auto max-h-60 text-xs">
              {localWishlist ? JSON.stringify(JSON.parse(localWishlist), null, 2) : 'No wishlist found'}
            </pre>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">Server Data {user ? '' : '(Login Required)'}</h2>
          
          {user ? (
            <>
              <div className="mb-4">
                <h3 className="font-medium">Cart</h3>
                <pre className="bg-white p-2 rounded border overflow-auto max-h-60 text-xs">
                  {serverCart || 'No cart data from server'}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium">Wishlist</h3>
                <pre className="bg-white p-2 rounded border overflow-auto max-h-60 text-xs">
                  {serverWishlist || 'No wishlist data from server'}
                </pre>
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic">Log in to see server data</p>
          )}
        </div>
      </div>
      
      {user && (
        <button 
          onClick={handleSync}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Synchronize Data Now
        </button>
      )}
    </div>
  );
}
