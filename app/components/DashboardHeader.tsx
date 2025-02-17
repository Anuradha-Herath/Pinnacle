"use client";

import React from 'react';

const DashboardHeader: React.FC = () => {
  return (
    <header className="bg-white p-4 flex justify-between items-center border-b">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-gray-500">Home > Dashboard</p>
      </div>
      <div className="flex items-center space-x-4">
        {/* ... Add header icons */}
        <p className="text-sm">Oct 11, 2024 - Nov 11, 2024</p>
      </div>
    </header>
  );
};

export default DashboardHeader;