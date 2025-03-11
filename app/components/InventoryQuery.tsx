"use client";

import { useState } from 'react';

export default function InventoryQuery() {
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleQuery = async () => {
    if (!color && !size) {
      alert('Please select at least one filter (color or size)');
      return;
    }
    
    setLoading(true);
    try {
      // Build query parameters
      let queryParams = new URLSearchParams();
      if (color) queryParams.append('color', color);
      if (size) queryParams.append('size', size);
      
      const response = await fetch(`/api/inventory/query?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to query inventory');
      }
      
      const data = await response.json();
      setResults(data);
      
    } catch (err) {
      console.error('Error querying inventory:', err);
      alert('Failed to retrieve inventory data');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Inventory Query</h2>
      
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm mb-1">Color</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g. Green"
            className="border rounded-md px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Size</label>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="e.g. S"
            className="border rounded-md px-3 py-2"
          />
        </div>
        
        <button
          onClick={handleQuery}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded-md self-end hover:bg-orange-600"
        >
          {loading ? 'Loading...' : 'Query'}
        </button>
      </div>
      
      {results && (
        <div>
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <p><span className="font-semibold">Total Products:</span> {results.count}</p>
            <p><span className="font-semibold">Total Quantity:</span> {results.totalQuantity}</p>
          </div>
          
          {results.items.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">Product</th>
                  <th className="p-2 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {results.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">{item.productName}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No items found matching your query.</p>
          )}
        </div>
      )}
    </div>
  );
}
