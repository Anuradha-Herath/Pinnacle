"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, PencilIcon, TrashIcon, BellIcon, Cog6ToothIcon, ClockIcon, ArrowUpIcon, UserIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import Image from "next/image";
import { Crown } from "lucide-react";
{/*import { Card, CardContent } from "@/components/ui/card";*/}

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function CustomerList() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customerCount, setCustomerCount] = useState<number>(0);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data = await response.json();
        if (data.success) {
          setCustomers(data.users);
          setCustomerCount(data.users.length);
        } else {
          throw new Error(data.error || 'Failed to fetch customers');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Function to format date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day} ${year}`;
  };

  // Function to determine customer type (just a placeholder implementation)
  const getCustomerType = (role: string) => {
    if (role === 'admin') return 'black';
    if (role === 'premium') return 'orange';
    return 'gray';
  };

  // Default profile image
  const defaultImage = "/p9.webp";

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Customers List</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={() => router.push("/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={() => router.push("/history")} className="p-2 hover:bg-gray-200 rounded-lg">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>
            
            <input
              type="text"
              placeholder="🔍 Search"
              className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

          </div>
        </div>

        {/* Customer Card */}
        <div className="w-64 p-4 rounded-2xl shadow-md bg-white">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-600">Total Customers</h3>
            <button className="text-gray-400">&#x22EE;</button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <div className="p-2 bg-red-500 text-white rounded-lg">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold ml-3">{customerCount}</span>
              <div className="flex items-center text-sm text-green-500 font-semibold ml-3">
                <ArrowUpIcon className="w-4 h-4" />
                <span className="ml-1">34.7%</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-right mt-1">Compared to Oct 2024</p>
        </div>

        {/* Customer List Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">All Customer List</h2>
            <button className="px-4 py-2 border rounded-lg text-gray-600">This Month ▼</button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Id</th>
                  <th className="p-3">Joined date</th>
                  <th className="p-1 text-right">Type<span className="pr-40"></span></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr 
                    key={customer._id}
                    className="border-t cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/customerdetails?id=${customer._id}`)}
                  >
                    <td className="p-3 flex items-center gap-3">
                      <Image src={defaultImage} alt={`${customer.firstName} ${customer.lastName}`} width={30} height={30} className="rounded-full" />
                      {`${customer.firstName} ${customer.lastName}`}
                    </td>
                    <td className="p-3">#{customer._id.substring(0, 5)}</td>
                    <td className="p-3">{customer.createdAt ? formatDate(customer.createdAt) : 'N/A'}</td>
                    <td className="p-3 text-right pr-10">
                      <Crown className={`w-5 h-5 ${getCustomerType(customer.role) === 'black' ? 'text-black' : getCustomerType(customer.role) === 'gray' ? 'text-gray-400' : 'text-orange-500'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div>
          <div className="flex justify-end mt-6 pr-4">
            <div className="flex items-center space-x-2">
              <a href="/previouspage"><button className="px-4 py-2 border-r bg-white hover:bg-gray-200">Previous</button></a>
              <button className="px-4 py-2 bg-orange-500 text-white font-semibold">1</button>
              <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">2</button>
              <a href="/nextpage"><button className="px-4 py-2 border-l bg-white hover:bg-gray-200">Next</button></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
