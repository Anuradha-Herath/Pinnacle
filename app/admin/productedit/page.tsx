"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import ProductGalleryForEdit from "@/app/components/ProductGalleryForEdit";

interface GalleryItem {
  src: string | ArrayBuffer | null;
  name: string;
  color: string;
}

export default function ProductEdit() {
  const router = useRouter();

  // Initial product data
  const initialFormData = {
    productName: "Classic Seamless Henly polo Tee",
    description:
      "The Classic Seamless Henley Polo Tee combines timeless style with modern comfort.",
    category: "Mens",
    subCategory: "Tees",
    regularPrice: "110.4",
    tag: "featured, new",
    sizes: ["S", "M", "L", "XL"],
    gallery: [
      { src: "p3.webp", name: "sample1.jpg", color: "Red" },
      { src: "p2.webp", name: "sample2.jpg", color: "Blue" },
      { src: "p1.webp", name: "sample3.jpg", color: "Green" },
    ] as GalleryItem[],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [mainProductImage, setMainProductImage] = useState<
    string | ArrayBuffer | null
  >(initialFormData.gallery[0]?.src || null);

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleImageRemove = (index: number) => {
    const newGallery = formData.gallery.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, gallery: newGallery }));

    if (index === 0 && newGallery.length > 0) {
      setMainProductImage(newGallery[0].src);
    } else if (newGallery.length === 0) {
      setMainProductImage(null);
    }
  };

  const handleGalleryUpdate = (newGallery: GalleryItem[]) => {
    setFormData((prev) => ({ ...prev, gallery: newGallery }));
    if (!mainProductImage && newGallery.length > 0) {
      setMainProductImage(newGallery[0].src);
    }
  };

  const handleUpdate = () => {
    if (
      !formData.productName ||
      !formData.category ||
      !formData.regularPrice ||
      !formData.subCategory ||
      !(formData.sizes.length > 0) ||
      formData.gallery.length === 0
    ) {
      alert(
        "Please fill in all required fields (Product Name, Sizes, Category, Sub-Category, Regular Price) and add at least one product image with color!"
      );
      return;
    }

    console.log("Updated Data:", formData); // Log the entire formData, including gallery
    alert("Product updated successfully!");
  };

  return (
    <div className="flex min-h-screen relative">
      <Sidebar />
      <div className="flex flex-col flex-1 pb-20">
        <TopBar title="Product Edit" />
        <div className="p-6 mx-auto w-full max-w-6xl">
          <div className="text-sm text-gray-500 mb-6">
            <span>Home</span> &gt; <span>All Products</span> &gt;
            <span className="font-semibold"> Edit Product</span>
          </div>
          <h1 className="text-2xl font-bold mb-8">Edit Product</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Fields */}
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md h-32 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sub Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Regular Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="regularPrice"
                  value={formData.regularPrice}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tag</label>
                <input
                  type="text"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            {/* Image and Size Section */}
            <div className="space-y-6">
              <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center">
                {mainProductImage ? (
                  <img
                    src={mainProductImage.toString()}
                    alt="Main Product"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500">Main Product Image</span>
                )}
              </div>

              <ProductGalleryForEdit
                gallery={formData.gallery}
                onGalleryUpdate={handleGalleryUpdate}
                onImageRemove={handleImageRemove}
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  Size <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {" "}
                  {/* Reduced gap for closer spacing */}
                  {["NS", "XS", "S", "M", "L", "XL", "2XL", "3XL"].map(
                    (size) => (
                      <label key={size} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.sizes.includes(size)}
                          onChange={() => handleSizeChange(size)}
                          className="hidden" // Hide the default checkbox
                        />
                        <span
                          className={`inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md border border-gray-300 cursor-pointer ${
                            formData.sizes.includes(size)
                              ? "bg-gray-500"
                              : "bg-gray-300" // Highlight selected size
                          }`}
                        >
                          {size}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end w-full mt-6 space-x-4">
            <button
              type="button"
              onClick={handleUpdate}
              className="px-11 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              UPDATE
            </button>
            <button
              type="button"
              onClick={() => confirm("Delete product?")}
              className="px-11 py-2 bg-orange-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              DELETE
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/productlist')}
              className="px-11 py-2 border border-black rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
