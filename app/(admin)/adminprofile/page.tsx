"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-600">Admin’s Profile</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={() => router.push("/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>
            
            <button onClick={() => router.push("/profile")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-60 flex items-center justify-center relative" style={{ backgroundImage: 'url(/profilebackground.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute -bottom-12">
              <Image src="/download.jpg" alt="Profile" width={80} height={80} className="h-40 w-40 rounded-full object-cover" />
            </div>
          </div>
          <div className="flex p-10 pt-20">
            <div className="w-1/2 text-left">
              <h2 className="text-2xl font-semibold pb-4">Dilusha Prabashwara</h2>
              <p className="text-lg text-gray-600 leading-relaxed"><strong>Email:</strong><br /> DilushaP23@gmail.com</p>
              <p className="text-lg text-gray-600 leading-relaxed"><strong>Phone:</strong><br /> +94723455608</p>
            </div>
            <div className="w-px bg-white mx-10 pr-20"></div>
            <div className="w-1/2 text-right pr-20 flex flex-col justify-end">
              <p className="text-left text-lg text-gray-600"><strong>Address:</strong><br /> 103/2, Union Place, Colombo 07</p>
              <p className="text-left text-lg text-gray-600"><strong>Registration Date:</strong> <br />Jun 28th, 2020</p>
              <p className="text-left text-lg text-gray-600"><strong>Last Login Date:</strong><br /> Dec 22nd, 2024</p>
            </div>
          </div>
          
          <div className="p-8 flex justify-end">
            <button className="px-10 py-4 bg-gray-300 text-gray-700 rounded-lg">BACK</button>
          </div>
        </div>
          </div>
        </div>
  );
}
