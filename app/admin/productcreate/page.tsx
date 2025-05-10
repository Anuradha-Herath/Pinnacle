"use client";
import ProductForm from "@/app/components/products/ProductForm";

export default function ProductCreate() {
  return (
    <ProductForm
      isEditMode={false}
      title="Add New Product"
      breadcrumbTitle="Add New Product"
    />
  );
}
