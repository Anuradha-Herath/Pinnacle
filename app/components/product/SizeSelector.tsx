import React from "react";

interface SizeSelectorProps {
  sizes: string[];
  onChange: (size: string) => void;
}

export default function SizeSelector({ sizes, onChange }: SizeSelectorProps) {
  const availableSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Size <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {availableSizes.map(size => (
          <label key={size} className="flex items-center">
            <input
              type="checkbox"
              checked={sizes.includes(size)}
              onChange={() => onChange(size)}
              className="hidden"
            />
            <span className={`inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md border border-gray-300 cursor-pointer ${sizes.includes(size) ? "bg-gray-500 text-white" : "bg-gray-300"}`}>
              {size}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
