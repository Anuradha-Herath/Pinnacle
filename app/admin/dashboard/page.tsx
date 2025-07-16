"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import StatsCard from "../../components/StatsCard";
import SaleGraph from "../../components/SaleGraph";
import BestSellingItems from "../../components/BestSellingItems";
import RecentOrders from "../../components/RecentOrders";
import { getDashboardData } from "@/app/api/dashboard/route";
import { DashboardData } from "@/app/api/dashboard/route";

const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Format currency helper function
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                  title="Total Orders"
                  value={dashboardData ? dashboardData.totalOrders.toString() : "0"}
                  percentage={(dashboardData && dashboardData.totalOrders > 0) ? "+" + ((dashboardData.totalOrders / 100) * 5).toFixed(1) : "0"}
                  iconType="bag"
                />
                <StatsCard
                  title="Active Orders"
                  value={dashboardData ? dashboardData.activeOrders.toString() : "0"}
                  percentage={(dashboardData && dashboardData.activeOrders > 0) ? "+" + ((dashboardData.activeOrders / 100) * 7).toFixed(1) : "0"}
                  iconType="bag"
                />
                <StatsCard
                  title="Completed Orders"
                  value={dashboardData ? dashboardData.completedOrders.toString() : "0"}
                  percentage={(dashboardData && dashboardData.completedOrders > 0) ? "+" + ((dashboardData.completedOrders / 100) * 4).toFixed(1) : "0"}
                  iconType="bag"
                />
                <StatsCard
                  title="Total Customers"
                  value={dashboardData ? dashboardData.totalCustomers.toString() : "0"}
                  percentage={(dashboardData && dashboardData.totalCustomers > 0) ? "+" + ((dashboardData.totalCustomers / 100) * 8).toFixed(1) : "0"}
                  iconType="person"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {dashboardData && (
                  <SaleGraph salesData={dashboardData.salesByMonth} />
                )}
                <BestSellingItems products={dashboardData?.bestSellingProducts} />
              </div>
              <RecentOrders />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
