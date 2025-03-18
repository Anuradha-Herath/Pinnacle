"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    
    // Use useEffect to handle client-side operations
    useEffect(() => {
        setMounted(true);
    }, []);
    
    const isActive = (path: string) => pathname === path;

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    // Helper function for Link or collapsed icon-only button
    const NavLink = ({ href, children, onClick }: { href: string, children: React.ReactNode, onClick?: () => void }) => (
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
                            <MdDashboard className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Dashboard</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/productlist">
                            <FaBoxOpen className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Products</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/categorylist">
                            <BiCategoryAlt className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Categories</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/inventorylist">
                            <MdInventory className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Inventory</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/orderlist">
                            <FaShoppingBag className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Orders</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/customerlist">
                            <FaUsers className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Customers</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/couponlist">
                            <RiCoupon3Line className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Coupons</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/discountlist">
                            <TbDiscount className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Discounts</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="/adminprofile">
                            <CgProfile className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Profile</span>}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            href="/logout"
                            onClick={(e) => {
                                e.preventDefault();
                                // Add your logout logic here, e.g.:
                                // logout();
                                // router.push('/login');
                            }}
                        >
                            <AiOutlineLogout className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Logout</span>}
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
