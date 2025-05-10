import React from "react";
import { useCategories } from "@/app/hooks/useCategories";

interface ProductBasicInfoFormProps {
  productName: string;
  description: string;
  category: string;
  subCategory: string;
  regularPrice: string;
  tag: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function ProductBasicInfoForm({
  productName,
  description,
  category,
  subCategory,
  regularPrice,
  tag,
  onChange,
}: ProductBasicInfoFormProps) {
  const { filteredSubCategories, loading } = useCategories(category);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="productName"
          value={productName}
          onChange={onChange}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={description}
          onChange={onChange}
          className="w-full p-3 border rounded-md h-32 focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Main Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={category}
          onChange={onChange}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Main Category</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Accessories">Accessories</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Sub Category <span className="text-red-500">*</span>
        </label>
        <select
          name="subCategory"
          value={subCategory}
          onChange={onChange}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
          disabled={!category || filteredSubCategories.length === 0}
        >
          <option value="">
            {loading
              ? "Loading subcategories..."
              : !category
              ? "Select main category first"
              : filteredSubCategories.length === 0
              ? "No subcategories available"
              : "Select Sub Category"}
          </option>
          {filteredSubCategories.map((category) => (
            <option key={category._id} value={category.title}>
              {category.title}
            </option>
          ))}
        </select>
        {category && filteredSubCategories.length === 0 && !loading && (
          <div className="text-sm text-orange-500 mt-1">
            No subcategories found for {category}.{" "}
            <a href="/admin/categorycreate" className="underline">
              Create one
            </a>
          </div>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Regular Price ($) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="regularPrice"
          value={regularPrice}
          onChange={onChange}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Tag</label>
        <input
          type="text"
          name="tag"
          value={tag}
          onChange={onChange}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
