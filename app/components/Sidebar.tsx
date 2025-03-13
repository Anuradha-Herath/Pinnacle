"use client";

import React, { useState } from "react";
import Link from "next/link"; // Import Link component
import { usePathname, useRouter } from "next/navigation"; // Import usePathname and useRouter for active route detection and navigation
import {
    AiOutlineHome,
    AiOutlineShoppingCart,
    AiOutlineFolderOpen,
    AiOutlineStock,
    AiOutlineDollar,
    AiOutlineUser,
    AiOutlinePercentage,
    AiOutlineLogout,
    AiOutlineMenu,
} from "react-icons/ai";
import { BsChevronDown } from "react-icons/bs";
import { authNotifications } from "@/lib/notificationService";
import { useAuth } from "../context/AuthContext";

const Sidebar: React.FC = () => {
    const [openProducts, setOpenProducts] = useState(false);
    const [openInventory, setOpenInventory] = useState(false);
    const [openCustomers, setOpenCustomers] = useState(false);
    const [openCoupons, setOpenCoupons] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    
    const pathname = usePathname(); // Get current path to determine active links
    const router = useRouter(); // Get router instance for navigation
      const { user, logout } = useAuth();
    
    const isActive = (path: string) => pathname === path;

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    // Helper function for Link or collapsed icon-only button
    const NavLink = ({ href, children, onClick }: { href: string, children: React.ReactNode, onClick?: (e?: React.MouseEvent<HTMLAnchorElement>) => void }) => (
        <Link
            href={href}
            className={`flex items-center p-2 rounded hover:bg-gray-700 ${isActive(href) ? 'bg-gray-700' : ''}`}
            onClick={onClick}
        >
            {children}
        </Link>
    );

    //logout-function
    const handleLogout = async () => {
        await logout();
        // Use notification service instead of direct toast call
        authNotifications.logoutSuccess();
       
        router.push('/adminlogin');
      };

    return (
        <aside
            className={`transition-all duration-300 ${
                collapsed ? "w-16" : "w-64"
            } bg-[#282C34] text-white p-4`}
        >
            <div className="mb-8 flex items-center justify-between">
                {!collapsed && (
                    <Link href="/dashboard" className="text-2xl font-semibold italic">
                        Pinnacle
                    </Link>
                )}
                <button onClick={toggleCollapsed}>
                    <AiOutlineMenu className="text-xl w-6 flex-shrink-0" />
                </button>
            </div>
            <nav>
                <ul className="space-y-2">
                    <li>
                        <NavLink href="/dashboard">
                            <AiOutlineHome className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Dashboard</span>}
                        </NavLink>
                    </li>
                    <li>
                        <button
                            className={`flex items-center p-2 rounded hover:bg-gray-700 w-full text-left ${
                                pathname.includes('/product') ? 'bg-gray-700' : ''
                            }`}
                            onClick={() => setOpenProducts(!openProducts)}
                        >
                            <AiOutlineShoppingCart className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="ml-2">Products</span>
                                    <BsChevronDown
                                        className={`ml-auto transition-transform ${
                                            openProducts ? "rotate-180" : ""
                                        }`}
                                    />
                                </>
                            )}
                        </button>
                        {openProducts && !collapsed && (
                            <ul className="pl-4 mt-2 space-y-1">
                                <li>
                                    <Link 
                                        href="/productlist" 
                                        className={`p-2 rounded hover:bg-gray-700 block ${
                                            isActive('/productlist') ? 'bg-gray-700' : ''
                                        }`}
                                    >
                                        Product List
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/productcreate"
                                        className={`p-2 rounded hover:bg-gray-700 block ${
                                            isActive('/productcreate') ? 'bg-gray-700' : ''
                                        }`}
                                    >
                                        Add Product
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <button
                            className={`flex items-center p-2 rounded hover:bg-gray-700 w-full text-left ${
                                pathname.includes('/category') ? 'bg-gray-700' : ''
                            }`}
                            onClick={() => setOpenProducts(!openProducts)}
                        >
                            <AiOutlineFolderOpen className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="ml-2">Categories</span>
                                    <BsChevronDown
                                        className={`ml-auto transition-transform ${
                                            openProducts ? "rotate-180" : ""
                                        }`}
                                    />
                                </>
                            )}
                        </button>
                        {openProducts && !collapsed && (
                            <ul className="pl-4 mt-2 space-y-1">
                                <li>
                                    <Link 
                                        href="/categorylist" 
                                        className={`p-2 rounded hover:bg-gray-700 block ${
                                            isActive('/categorylist') ? 'bg-gray-700' : ''
                                        }`}
                                    >
                                        Category List
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/categorycreate"
                                        className={`p-2 rounded hover:bg-gray-700 block ${
                                            isActive('/categorycreate') ? 'bg-gray-700' : ''
                                        }`}
                                    >
                                        Add Category
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <button
                            className={`flex items-center p-2 rounded hover:bg-gray-700 w-full text-left ${
                                pathname.includes('/inventory') ? 'bg-gray-700' : ''
                            }`}
                            onClick={() => setOpenInventory(!openInventory)}
                        >
                            <AiOutlineStock className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="ml-2">Inventory</span>
                                    <BsChevronDown
                                        className={`ml-auto transition-transform ${
                                            openInventory ? "rotate-180" : ""
                                        }`}
                                    />
                                </>
                            )}
                        </button>
                        {openInventory && !collapsed && (
                            <ul className="pl-4 mt-2 space-y-1">
                                <li>
                                    <Link 
                                        href="/inventory" 
                                        className="p-2 rounded hover:bg-gray-700 block"
                                    >
                                        Stock List
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/inventory/add" 
                                        className="p-2 rounded hover:bg-gray-700 block"
                                    >
                                        Stock In
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <NavLink href="/orders">
                            <AiOutlineDollar className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Orders</span>}
                        </NavLink>
                    </li>
                    <li>
                        <button
                            className={`flex items-center p-2 rounded hover:bg-gray-700 w-full text-left ${
                                pathname.includes('/customer') ? 'bg-gray-700' : ''
                            }`}
                            onClick={() => setOpenCustomers(!openCustomers)}
                        >
                            <AiOutlineUser className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && (
                                <>
                                    <span className="ml-2">Customers</span>
                                    <BsChevronDown
                                        className={`ml-auto transition-transform ${
                                            openCustomers ? "rotate-180" : ""
                                        }`}
                                    />
                                </>
                            )}
                        </button>
                        {openCustomers && !collapsed && (
                            <ul className="pl-4 mt-2 space-y-1">
                                <li>
                                    <Link 
                                        href="/customers" 
                                        className="p-2 rounded hover:bg-gray-700 block"
                                    >
                                        Customer List
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <NavLink href="/coupons">
                            <AiOutlinePercentage className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Coupons</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/discounts">
                            <AiOutlinePercentage className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Discounts</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/profile">
                            <AiOutlineUser className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Profile</span>}
                        </NavLink>
                    </li>
                    <li>
                    <button
                            onClick={handleLogout}
                           className="hover:bg-gray-700 rounded w-full text-left py-2 "
                        >
                            <div className="inline-flex items-center">
                            <AiOutlineLogout className="text-xl w-8 flex-shrink-0 pl-3" />
                            {!collapsed && <span className="ml-2">Logout</span>}
                            </div>
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
