"use client";

import React, { useState } from "react";
import {
    AiOutlineHome,
    AiOutlineShoppingCart,
    AiOutlineFolderOpen,
    AiOutlineStock,
    AiOutlineDollar,
    AiOutlineUser,
    AiOutlinePercentage,
    AiOutlineLogout,
    AiOutlineMenu, // Import hamburger icon
} from "react-icons/ai";
import { BsChevronDown } from "react-icons/bs";

const Sidebar: React.FC = () => {
    const [openProducts, setOpenProducts] = useState(false);
    const [openInventory, setOpenInventory] = useState(false);
    const [openCustomers, setOpenCustomers] = useState(false);
    const [openCoupons, setOpenCoupons] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    return (
        <aside
            className={`transition-all duration-300 ${
                collapsed ? "w-16" : "w-64"
            } bg-[#282C34] text-white p-4`}
        >
            <div className="mb-8 flex items-center justify-between">
                {!collapsed && (
                    <h1 className="text-2xl font-semibold italic">Pinnacle</h1>
                )}
                <button onClick={toggleCollapsed}>
                    <AiOutlineMenu className="text-xl w-6 flex-shrink-0" />
                </button>
            </div>
            <nav>
                <ul className="space-y-2">
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                        >
                            <AiOutlineHome className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Dashboard</span>}
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                            onClick={() => setOpenProducts(!openProducts)}
                        >
                            <AiOutlineShoppingCart className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Products</span>}
                            <BsChevronDown
                                className={`ml-auto transition-transform ${
                                    openProducts ? "rotate-180" : ""
                                }`}
                            />
                        </a>
                        {openProducts && !collapsed && (
                            <ul className="pl-4 mt-2 space-y-1">
                                <li>
                                    <a href="#" className="p-2 rounded hover:bg-gray-700 block">
                                        Product List
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="p-2 rounded hover:bg-gray-700 block">
                                        Add Product
                                    </a>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                        >
                            <AiOutlineFolderOpen className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Category</span>}
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                            onClick={() => setOpenInventory(!openInventory)}
                        >
                            <AiOutlineStock className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Inventory</span>}
                            <BsChevronDown
                                className={`ml-auto transition-transform ${
                                    openInventory ? "rotate-180" : ""
                                }`}
                            />
                        </a>
                        {openInventory && !collapsed && (
                            <ul className="pl-4 mt-2 space-y-1">
                                <li>
                                    <a href="#" className="p-2 rounded hover:bg-gray-700 block">
                                        Stock List
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="p-2 rounded hover:bg-gray-700 block">
                                        Stock In
                                    </a>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                        >
                            <AiOutlineDollar className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Orders</span>}
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                            onClick={() => setOpenCustomers(!openCustomers)}
                        >
                            <AiOutlineUser className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Customers</span>}
                            <BsChevronDown
                                className={`ml-auto transition-transform ${
                                    openCustomers ? "rotate-180" : ""
                                }`}
                            />
                        </a>
                        {openCustomers && !collapsed && (
                            <ul className="pl-4 mt-2 space-y-1">
                                <li>
                                    <a href="#" className="p-2 rounded hover:bg-gray-700 block">
                                        Customer List
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="p-2 rounded hover:bg-gray-700 block">
                                        Add Customer
                                    </a>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                            onClick={() => setOpenCoupons(!openCoupons)}
                        >
                            <AiOutlinePercentage className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Coupons</span>}
                            <BsChevronDown
                                className={`ml-auto transition-transform ${
                                    openCoupons ? "rotate-180" : ""
                                }`}
                            />
                        </a>
                        {openCoupons && !collapsed && (
                            <ul className="pl-4 mt-2 space-y-1">
                                <li>
                                    <a href="#" className="p-2 rounded hover:bg-gray-700 block">
                                        Coupon List
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="p-2 rounded hover:bg-gray-700 block">
                                        Add Coupon
                                    </a>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                        >
                            <AiOutlinePercentage className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Discounts</span>}
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                        >
                            <AiOutlineUser className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Profile</span>}
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className="flex items-center p-2 rounded hover:bg-gray-700"
                        >
                            <AiOutlineLogout className="text-xl w-6 flex-shrink-0" />
                            {!collapsed && <span className="ml-2">Logout</span>}
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
