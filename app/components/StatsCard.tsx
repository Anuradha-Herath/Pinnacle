"use client";

import React from "react";
import { BsBagFill, BsPersonFill } from "react-icons/bs";
import { HiDotsVertical } from "react-icons/hi";
import { format, subMonths } from "date-fns";

interface StatsCardProps {
  title: string;
  value: string;
  percentage: string;
  iconType: "bag" | "person"; // Add iconType prop
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  percentage,
  iconType,
}) => {
  const getIcon = () => {
    if (iconType === "bag") {
      return <BsBagFill className="text-white" />;
    } else if (iconType === "person") {
      return <BsPersonFill className="text-white" />;
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
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <HiDotsVertical className="text-gray-500" />
      </div>
      <div className="flex items-center space-x-2 mb-2">
        <div className="bg-orange-500 p-2 rounded">{getIcon()}</div>
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-green-500 text-sm">↑{percentage}%</span>
      </div>
      <p className="text-sm text-gray-500">Compared to {getFormattedPreviousMonth()}</p>
    </div>
  );
};

export default StatsCard;
