"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import StatsCard from "../../components/StatsCard";
import SaleGraph from "../../components/SaleGraph";
import BestSellingItems from "../../components/BestSellingItems";
import RecentOrders from "../../components/RecentOrders";
import withAuth from "../../components/withAuth";
import { getDashboardData } from "@/app/api/dashboard/route";
import { DashboardData } from "@/app/api/dashboard/route";
import { useAuth } from "../../context/AuthContext";

const DashboardPage: React.FC = () => {
  console.log('Dashboard: Component rendering started');
  
  const { user, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug the auth state
  useEffect(() => {
    console.log('Dashboard: Auth state changed:', { 
      user, 
      loading, 
      userRole: user?.role,
      timestamp: new Date().toISOString()
    });
  }, [user, loading]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setDataLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setDataLoading(false);
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
          {dataLoading ? (
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
                  title="Total Active Data"
                  value={dashboardData ? dashboardData.totalActiveData.toString() : "0"}
                  percentage={(dashboardData && dashboardData.totalActiveData > 0) ? "+" + ((dashboardData.totalActiveData / 100) * 6).toFixed(1) : "0"}
                  iconType="chart"
                  subtitle="Sum of Active & Completed Orders"
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
                  subtitle="Processing, Shipped & Paid"
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {dashboardData && (
                  <SaleGraph salesData={dashboardData.salesByMonth} />
                )}
                <BestSellingItems products={dashboardData?.bestSellingProducts} />
              </div>
              <div className="mt-2">
                <RecentOrders />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// Export with admin authentication protection
export default withAuth(DashboardPage, {
  requireAdmin: true,
  redirectTo: '/admin/adminlogin'
});
