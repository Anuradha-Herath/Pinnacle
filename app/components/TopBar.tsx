import React from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

interface TopBarProps {
  title: string; // Custom title for each page
}

const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const router = useRouter();

  return (
    <div className="bg-gray-50 p-4 flex justify-between items-center">
      {/* Page Title - Passed as a prop */}
      <h1 className="text-2xl font-semibold">{title}</h1>

      {/* Top-Right Icons */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button onClick={() => router.push("/admin/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>

        {/* Settings */}
        <button onClick={() => router.push("/admin/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
        </button>

        {/* Order History / Activity Log */}
        <button onClick={() => router.push("/admin/history")} className="p-2 hover:bg-gray-200 rounded-lg">
          <ClockIcon className="h-6 w-6 text-gray-600" />
        </button>

        {/* Profile */}
        <button onClick={() => router.push("/admin/profilepage")} className="p-1 rounded-full border-2 border-gray-300">
          <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
