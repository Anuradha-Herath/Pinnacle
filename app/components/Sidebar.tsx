"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { authNotifications } from "@/lib/notificationService";
import {
    AiOutlineLogout,
    AiOutlineMenu,
} from "react-icons/ai";
import { MdDashboard, MdInventory } from "react-icons/md";
import { FaBoxOpen, FaShoppingBag, FaTag, FaUsers } from "react-icons/fa";
import { BiCategoryAlt } from "react-icons/bi";
import { RiCoupon3Line } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import { TbDiscount } from "react-icons/tb";

const Sidebar: React.FC = () => {
    // Use useState with an explicit boolean type to avoid hydration issues
    const [collapsed, setCollapsed] = useState<boolean>(false);
    // Client-side only state
    const [mounted, setMounted] = useState<boolean>(false);
    
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();
    
    // Use useEffect to handle client-side operations
    useEffect(() => {
        setMounted(true);
    }, []);
    
    const isActive = (path: string) => pathname === path;

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    const handleLogout = async () => {
        await logout();
        // Use notification service instead of direct toast call
        authNotifications.logoutSuccess();
        router.push('/adminlogin');
    };

    // Helper function for Link or collapsed icon-only button
    const NavLink = ({ href, children, onClick }: { 
        href: string, 
        children: React.ReactNode, 
        onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void 
    }) => (
        <Link
            href={href}
            className={`flex items-center p-2 rounded hover:bg-gray-700 ${mounted && isActive(href) ? 'bg-gray-700' : ''}`}
            onClick={onClick}
        >
            {children}
        </Link>
    );

    return (
        <aside
            className={`transition-all duration-300 ${
                collapsed ? "w-16" : "w-64"
            } bg-[#282C34] text-white p-4`}
        >
            <div className="mb-8 flex items-center justify-between">
                {!collapsed && (
                    <Link href="/admin/dashboard" className="text-2xl font-semibold italic">
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
                        <NavLink href="/admin/dashboard">
                            <MdDashboard className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Dashboard</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/admin/productlist">
                            <FaBoxOpen className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Products</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/admin/categorylist">
                            <BiCategoryAlt className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Categories</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/admin/inventorylist">
                            <MdInventory className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Inventory</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/admin/orderlist">
                            <FaShoppingBag className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Orders</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/admin/customerlist">
                            <FaUsers className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Customers</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/admin/couponlist">
                            <RiCoupon3Line className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Coupons</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/admin/discountlist">
                            <TbDiscount className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Discounts</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/admin/adminprofile">
                            <CgProfile className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Profile</span>}
                        </NavLink>
                    </li>
                    <li>
                        <button
                            onClick={handleLogout}
                            className="hover:bg-gray-700 rounded w-full text-left py-2"
                      
                       >
                            <div className="inline-flex items-center">
                                <AiOutlineLogout className="text-xl w-8 flex-shrink-0 pl-2" />
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
