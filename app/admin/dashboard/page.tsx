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

  // Calculate customer metrics
  const calculateCustomerMetrics = () => {
    if (!dashboardData) return null;
    
    // Calculate approximate new customers this month (12% of total for demo)
    const newCustomers = Math.round(dashboardData.totalCustomers * 0.12);
    
    // Calculate approximate repeat buyers (65% of total for demo)
    const repeatBuyers = Math.round(dashboardData.totalCustomers * 0.65);
    
    // Calculate approximate unique customers with orders (80% of total orders for demo)
    const customersWithOrders = Math.round(dashboardData.totalOrders * 0.8);
    
    return {
      newCustomers,
      repeatBuyers,
      customersWithOrders
    };
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
              
              
              {/* Stats cards section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                  title="Total Orders"
                  value={dashboardData ? dashboardData.totalOrders.toString() : "0"}
                  percentage={(dashboardData && dashboardData.totalOrders > 0) ? "+" + ((dashboardData.totalOrders / 100) * 6).toFixed(1) : "0"}
                  iconType="chart"
                  subtitle="Sum of Active & Completed Paid Orders"
                  detailCounts={dashboardData ? [
                    { label: "Active", count: dashboardData.activeOrders },
                    { label: "Completed", count: dashboardData.completedOrders }
                  ] : undefined}
                />
                
                <StatsCard
                  title="Active Orders"
                  value={dashboardData ? dashboardData.activeOrders.toString() : "0"}
                  percentage={(dashboardData && dashboardData.activeOrders > 0) ? "+" + ((dashboardData.activeOrders / 100) * 7).toFixed(1) : "0"}
                  iconType="bag"
                  subtitle="Processing, Shipped & Paid Orders"
                  detailCounts={dashboardData ? [
                    { label: "Processing", count: dashboardData.processingOrders },
                    { label: "Shipped", count: dashboardData.shippedOrders },
                    { label: "Paid", count: dashboardData.paidOrders }
                  ] : undefined}
                />
                <StatsCard
                  title="Completed Orders"
                  value={dashboardData ? dashboardData.completedOrders.toString() : "0"}
                  percentage={(dashboardData && dashboardData.completedOrders > 0) ? "+" + ((dashboardData.completedOrders / 100) * 4).toFixed(1) : "0"}
                  iconType="bag"
                  subtitle="Delivered & Refunded"
                  detailCounts={dashboardData ? [
                    { label: "Delivered", count: dashboardData.deliveredOrders },
                    { label: "Refunded", count: dashboardData.refundedOrders }
                  ] : undefined}
                />
                <StatsCard
                  title="Total Customers"
                  value={dashboardData ? dashboardData.totalCustomers.toString() : "0"}
                  percentage={(dashboardData && dashboardData.totalCustomers > 0) ? "+" + ((dashboardData.totalCustomers / 100) * 8).toFixed(1) : "0"}
                  iconType="person"
                  subtitle="Registered Users"
                  detailCounts={dashboardData ? [
                    { label: "New This Month", count: calculateCustomerMetrics()?.newCustomers || 0 },
                    { label: "Repeat Buyers", count: calculateCustomerMetrics()?.repeatBuyers || 0 }
                  ] : undefined}
                />
              </div>
              
              {/* Charts and trending products section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {dashboardData && (
                  <div className="bg-white rounded shadow overflow-hidden">
                    <SaleGraph salesData={dashboardData.salesByMonth} />
                  </div>
                )}
                <div className="bg-white rounded shadow overflow-hidden">
                  <BestSellingItems products={dashboardData?.bestSellingProducts} />
                </div>
              </div>
              
             
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
