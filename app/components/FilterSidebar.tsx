"use client";

import React, { useState } from "react";
import { XIcon } from "lucide-react";

interface FilterSidebarProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  availableSizes?: string[];
  priceRange?: { min: number; max: number };
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export interface FilterOptions {
  priceRange: [number, number];
  sizes: string[];
  sortBy: string;
  onSale?: boolean;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  onFilterChange,
  initialFilters = {
    priceRange: [0, 5000],
    sizes: [],
    sortBy: "newest",
    onSale: false,
  },
  availableSizes = ["XS", "S", "M", "L", "XL", "XXL"],
  priceRange = { min: 0, max: 5000 },
  isMobile = false,
  onMobileClose,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(
    initialFilters.priceRange
  );

  const handlePriceChange = (index: number, value: number) => {
    const newPriceRange = [...localPriceRange] as [number, number];
    newPriceRange[index] = value;
    setLocalPriceRange(newPriceRange);
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];

    const newFilters = { ...filters, sizes: newSizes };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (value: string) => {
    const newFilters = { ...filters, sortBy: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSaleToggle = () => {
    const newFilters = { ...filters, onSale: !filters.onSale };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const applyPriceFilter = () => {
    // Make sure min is less than max
    const sortedRange: [number, number] = [
      Math.min(...localPriceRange),
      Math.max(...localPriceRange),
    ];
    const newFilters = { ...filters, priceRange: sortedRange };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      priceRange: [priceRange.min, priceRange.max],
      sizes: [],
      sortBy: "newest",
      onSale: false,
    };
    setFilters(defaultFilters);
    setLocalPriceRange([priceRange.min, priceRange.max]);
    onFilterChange(defaultFilters);
  };

  return (
    <div className={`bg-white p-4 ${isMobile ? "rounded-lg shadow-lg" : ""}`}>
      {isMobile && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Filters</h2>
          <button onClick={onMobileClose} className="text-gray-500">
            <XIcon size={20} />
          </button>
        </div>
      )}

      {/* Sort By */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2 text-gray-800">Sort By</h3>
        <select
          value={filters.sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded bg-white"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="popularity">Popularity</option>
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2 text-gray-800">Price Range</h3>
        <div className="flex items-center mb-2">
          <div className="flex-1">
            <label className="text-sm text-gray-600 block mb-1">Min ($)</label>
            <input
              type="number"
              min={priceRange.min}
              max={priceRange.max}
              value={localPriceRange[0]}
              onChange={(e) => handlePriceChange(0, +e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <span className="mx-2 text-gray-500">-</span>
          <div className="flex-1">
            <label className="text-sm text-gray-600 block mb-1">Max ($)</label>
            <input
              type="number"
              min={priceRange.min}
              max={priceRange.max}
              value={localPriceRange[1]}
              onChange={(e) => handlePriceChange(1, +e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
        <button
          onClick={applyPriceFilter}
          className="w-full mt-2 bg-gray-800 text-white py-2 rounded hover:bg-gray-900"
        >
          Apply
        </button>
      </div>

      {/* Size Filter */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2 text-gray-800">Size</h3>
        <div className="grid grid-cols-3 gap-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => handleSizeToggle(size)}
              className={`py-2 border ${
                filters.sizes.includes(size)
                  ? "bg-black text-white border-black"
                  : "border-gray-300 hover:border-gray-400"
              } rounded text-sm`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Sale Filter */}
      <div className="mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onSale}
            onChange={handleSaleToggle}
            className="h-5 w-5 rounded border-gray-300 focus:ring-0 checked:bg-black"
          />
          <span className="ml-2 text-gray-800">On Sale</span>
        </label>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetFilters}
        className="w-full py-2 border border-gray-300 rounded text-gray-800 hover:bg-gray-100"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterSidebar;
