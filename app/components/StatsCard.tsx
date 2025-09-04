"use client";

import React from "react";
import { BsBagFill, BsPersonFill, BsBarChartFill } from "react-icons/bs";
import { HiDotsVertical } from "react-icons/hi";
import { format, subMonths } from "date-fns";

interface StatsCardProps {
  title: string;
  value: string;
  percentage: string;
  iconType: "bag" | "person" | "chart"; // Add chart icon type
  subtitle?: string; // Optional subtitle for additional context
  detailCounts?: { label: string; count: number }[]; // Optional array of detailed counts
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  percentage,
  iconType,
  subtitle,
  detailCounts,
}) => {
  const getIcon = () => {
    if (iconType === "bag") {
      return <BsBagFill className="text-white" />;
    } else if (iconType === "person") {
      return <BsPersonFill className="text-white" />;
    } else if (iconType === "chart") {
      return <BsBarChartFill className="text-white" />;
    }
    return null;
  };

  // Function to get the formatted previous month
  const getFormattedPreviousMonth = () => {
    const currentDate = new Date();
    const previousMonth = subMonths(currentDate, 1);
    return format(previousMonth, "MMM yyyy");
  };

  return (
    <div className="bg-white p-4 rounded shadow hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <HiDotsVertical className="text-gray-500" />
      </div>
      <div className="flex items-center space-x-2 mb-2">
        <div className="bg-orange-500 p-2 rounded">{getIcon()}</div>
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-green-500 text-sm">↑{percentage}%</span>
      </div>
      
      {/* Display detailed counts if provided */}
      {detailCounts && detailCounts.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100 fadeIn">
          <div className={`grid ${detailCounts.length > 2 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            {detailCounts.map((item, index) => (
              <div key={index} className="flex flex-col transition-all duration-300 hover:bg-gray-50 p-1 rounded" 
                   style={{animationDelay: `${index * 0.1}s`}}>
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className="text-sm font-semibold text-gray-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-sm text-gray-500 mt-2">Compared to {getFormattedPreviousMonth()}</p>
    </div>
  );
};

export default StatsCard;
