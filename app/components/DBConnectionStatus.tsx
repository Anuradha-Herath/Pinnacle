"use client";

import { useState, useEffect } from "react";

export default function DBConnectionStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [message, setMessage] = useState<string>('Checking database connection...');

  useEffect(() => {
    const checkDBStatus = async () => {
      try {
        const response = await fetch('/api/db-status');
        const data = await response.json();
        
        if (response.ok) {
          setStatus('connected');
          setMessage(data.message);
        } else {
          setStatus('disconnected');
          setMessage(data.message);
        }
      } catch (error) {
        setStatus('disconnected');
        setMessage('Failed to check database connection');
      }
    };

    checkDBStatus();
  }, []);

  return (
    <div className="p-4 rounded-md">
      <div className={`flex items-center gap-2 ${
        status === 'loading' ? 'text-gray-500' :
        status === 'connected' ? 'text-green-500' : 
        'text-red-500'
      }`}>
        <div className={`w-3 h-3 rounded-full ${
          status === 'loading' ? 'bg-gray-500' :
          status === 'connected' ? 'bg-green-500' : 
          'bg-red-500'
        }`}></div>
        <p className="font-medium">
          Database: {status === 'loading' ? 'Checking connection...' : 
                    status === 'connected' ? 'Connected' : 
                    'Disconnected'}
        </p>
      </div>
      <p className="text-sm text-gray-600 mt-1">{message}</p>
    </div>
  );
}
