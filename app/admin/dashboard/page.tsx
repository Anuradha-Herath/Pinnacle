"use client";

import React from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import StatsCard from "../../components/StatsCard";
import SaleGraph from "../../components/SaleGraph";
import BestSellingItems from "../../components/BestSellingItems";
import RecentOrders from "../../components/RecentOrders";

const DashboardPage: React.FC = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Orders"
              value="$126.500"
              percentage="34.7%"
              iconType="bag" // Added iconType
            />
            <StatsCard
              title="Active Orders"
              value="$126.500"
              percentage="34.7%"
              iconType="bag" // Added iconType
            />
            <StatsCard
              title="Completed Orders"
              value="$126.500"
              percentage="34.7%"
              iconType="bag" // Added iconType
            />
            <StatsCard
              title="Total Customers"
              value="1013"
              percentage="34.7%"
              iconType="person" // Added iconType
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SaleGraph />
            <BestSellingItems />
          </div>
          <RecentOrders />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
