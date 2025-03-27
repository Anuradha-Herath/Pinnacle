"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, PencilIcon, TrashIcon, BellIcon, Cog6ToothIcon, ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";

export default function CouponsList() {
  const router = useRouter();
  interface Coupon {
    _id: string;
    product: string;
    price: number;
    discount: string;
    code: string;
    startDate: string;
    endDate: string;
    status: string;
  }

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);

  // Fetch coupons from API
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/coupons');
        if (!response.ok) {
          throw new Error('Failed to fetch coupons');
        }
        const data = await response.json();
        setCoupons(data.coupons);
        
        // Count active and expired coupons
        const active = data.coupons.filter((coupon: Coupon) => coupon.status === 'Active').length;
        const expired = data.coupons.filter((coupon: Coupon) => coupon.status === 'Expired').length;
        setActiveCount(active);
        setExpiredCount(expired);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching coupons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  // Handle view coupon
  const handleView = (id: string) => {
    router.push(`/couponview?id=${id}`);
  };

  // Handle edit coupon
  const handleEdit = (id: string) => {
    router.push(`/couponedit?id=${id}`);
  };

  // Handle delete coupon
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      try {
        const response = await fetch(`/api/coupons/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete coupon');
        }
        
        // Remove the deleted coupon from the state
        setCoupons(coupons.filter(coupon => coupon._id !== id));
        alert("Coupon deleted successfully");
      } catch (err) {
        console.error('Error deleting coupon:', err);
        alert(`Failed to delete coupon: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
      }
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-4 flex-1">
        <TopBar title="Coupons List" />

        {/* Add Coupon Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push("/couponcreate")}
            className="bg-orange-500 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-md hover:bg-orange-600"
          >
            <PlusIcon className="h-5 w-5" /> Create a Coupon
          </button>
        </div>

        {/* Coupon Stats */}
        <div className="grid grid-cols-2 gap-1 mb-6 justify-center">
          {/* Active Coupons */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between w-1/2 mx-auto">
            <div>
              <p className="text-gray-700 text-lg font-semibold">
                Active Coupons
              </p>
              <p className="text-gray-900 text-2xl font-bold">{activeCount}</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-xl">
              <img
                src="/active coupon.png"
                alt="Active Coupons"
                className="h-10 w-10"
              />
            </div>
          </div>

          {/* Expired Coupons */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between w-1/2 mx-auto">
            <div>
              <p className="text-gray-700 text-lg font-semibold">
                Expired Coupons
              </p>
              <p className="text-gray-900 text-2xl font-bold">{expiredCount}</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-xl">
              <img
                src="/expired coupon.png"
                alt="Expired Coupons"
                className="h-10 w-10"
              />
            </div>
          </div>
        </div>

        {/* Coupon Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-gray-600 font-semibold">
              All Coupons List
            </h2>
            <button className="px-4 py-2 border rounded-lg text-gray-600">
              This Month ▼
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading coupons...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">Error: {error}</div>
          ) : (
            <table className="w-full border-collapse text-gray-600">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right pr-10">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon._id} className="border-t">
                      <td className="p-3">{coupon.product}</td>
                      <td className="p-3">{coupon.price}</td>
                      <td className="p-3">{coupon.discount}</td>
                      <td className="p-3">{coupon.code}</td>
                      <td className="p-3">{coupon.startDate}</td>
                      <td className="p-3">{coupon.endDate}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-center align-middle ${
                            coupon.status === "Future"
                              ? "bg-blue-300 text-blue-800"
                              : coupon.status === "Active"
                              ? "bg-green-300 text-green-800"
                              : coupon.status === "Expired"
                              ? "bg-orange-300 text-orange-800"
                              : ""
                          }`}
                        >
                          {coupon.status}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2 justify-end">
                        <button
                          onClick={() => handleView(coupon._id)}
                          className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(coupon._id)}
                          className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          <div className="flex justify-end mt-6 pr-4">
            <div className="flex items-center border rounded-md overflow-hidden shadow-md">
              <button className="px-4 py-2 border-r bg-white hover:bg-gray-200">
                Previous
              </button>
              <button className="px-4 py-2 bg-orange-500 text-white font-semibold">
                1
              </button>
              <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">
                2
              </button>
              <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
