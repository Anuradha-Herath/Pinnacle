import React from 'react'
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

type TopBarProps = {
    heading: string;
}

const TopBar = ( { heading } : TopBarProps ) => {
    const router = useRouter();
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold">{heading}</h1>

      {/* Top-Right Icons */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          onClick={() => router.push("/admin/notifications")}
          className="p-2 hover:bg-gray-200 rounded-lg"
        >
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>

        {/* Settings */}
        <button
          onClick={() => router.push("/admin/settings")}
          className="p-2 hover:bg-gray-200 rounded-lg"
        >
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
        </button>
        
        <button
          onClick={() => router.push("/admin/history")}
          className="p-2 hover:bg-gray-200 rounded-lg"
        >
          <ClockIcon className="h-6 w-6 text-gray-600" />
        </button>

        {/* Profile */}
        <button
          onClick={() => router.push("../../profilepage")}
          className="p-1 rounded-full border-2 border-gray-300"
        >
          <img
            src="/p9.webp"
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
          />
        </button>
      </div>
    </div>
  );
}

export default TopBar;




