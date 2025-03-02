"use client";

import React, { useState } from 'react';

interface DebugDisplayProps {
  data: any;
  title?: string;
}

const DebugDisplay: React.FC<DebugDisplayProps> = ({ data, title = "Debug Data" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="mb-4 p-4 border border-gray-300 rounded bg-gray-50">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-700">{title}</h3>
        <button 
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isExpanded && (
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default DebugDisplay;
