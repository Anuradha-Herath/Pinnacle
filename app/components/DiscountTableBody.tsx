import React from "react";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { PLACEHOLDER_IMAGE, handleImageError } from "@/lib/imageUtils";

// Remove the duplicate constant since we're importing it

interface Discount {
  _id: string;
  product: string;
  type: string;
  percentage: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt?: string;
}

interface ItemDetails {
  id: string;
  name: string;
  image: string;
}

interface DiscountTableBodyProps {
  discounts: Discount[];
  itemDetails: Record<string, ItemDetails>;
  loadingItems: Set<string>;
  error: string;
  statusFilter: string | null;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const DiscountTableBody: React.FC<DiscountTableBodyProps> = ({
  discounts,
  itemDetails,
  loadingItems,
  error,
  statusFilter,
  onView,
  onEdit,
  onDelete,
}) => {
  // Helper function to safely render product details
  const renderProductDetails = (discount: Discount) => {
    // Check if we have valid product ID
    if (!discount.product) {
      return (
        <>
          <div className="h-10 w-10 mr-3 overflow-hidden rounded bg-gray-100 flex items-center justify-center">
            <span className="text-xs text-gray-400">N/A</span>
          </div>
          <span className="text-gray-500">Unknown Product</span>
        </>
      );
    }
    
    // Check if product details are loaded
    if (itemDetails && itemDetails[discount.product]) {
      return (
        <>
          <div className="h-10 w-10 relative mr-3 overflow-hidden rounded bg-gray-100">
            {loadingItems && loadingItems.has(discount.product) ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <img
                src={itemDetails[discount.product]?.image || PLACEHOLDER_IMAGE}
                alt={itemDetails[discount.product]?.name || 'Product Image'}
                className="h-full w-full object-cover"
                onError={handleImageError}
                loading="eager"
              />
            )}
          </div>
          <span className="font-medium">
            {itemDetails[discount.product]?.name || 'Unknown Product'}
          </span>
        </>
      );
    }
    
    // Product details are still loading or not available
    return (
      <>
        <div className="h-10 w-10 relative mr-3 overflow-hidden rounded bg-gray-100 flex items-center justify-center">
          {loadingItems && loadingItems.has(discount.product) ? (
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-xs text-gray-500">ID</span>
          )}
        </div>
        <span className="text-gray-600 max-w-[120px] truncate" title={discount.product}>
          {discount.product.substring(0, 10)}...
        </span>
      </>
    );
  };

  // Safety check for discounts array
  if (!discounts || !Array.isArray(discounts)) {
    return (
      <tbody>
        <tr>
          <td colSpan={7} className="p-3 text-center">
            <p className="text-red-500">Invalid discount data received</p>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {discounts.length > 0 ? (
        discounts.map((discount, index) => {
          // Safety check for each discount
          if (!discount || !discount._id) {
            return (
              <tr key={`invalid-discount-${index}`} className="border-t bg-red-50">
                <td colSpan={7} className="p-3 text-center text-red-500">
                  Invalid discount record
                </td>
              </tr>
            );
          }
          
          return (
            <tr key={discount._id} className="border-t">
              <td className="p-3">
                <div className="flex items-center">
                  {renderProductDetails(discount)}
                </div>
              </td>
              <td className="p-3">{discount.type || 'N/A'}</td>
              <td className="p-3">{discount.percentage ? `${discount.percentage}%` : 'N/A'}</td>
              <td className="p-3">{discount.startDate || 'N/A'}</td>
              <td className="p-3">{discount.endDate || 'N/A'}</td>
              <td className="p-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold 
                    ${
                      discount.status === "Active"
                        ? "bg-green-300 text-green-800"
                        : discount.status === "Future Plan"
                        ? "bg-blue-300 text-blue-800"
                        : "bg-orange-300 text-orange-800"
                    }`}
                >
                  {discount.status || 'N/A'}
                </span>
              </td>
              <td className="p-3 flex gap-2 justify-end">
                <button
                  onClick={() => onView(discount._id)}
                  className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onEdit(discount._id)}
                  className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(discount._id)}
                  className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan={7} className="p-3 text-center">
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : statusFilter ? (
              <p>No {statusFilter} discounts found.</p>
            ) : (
              <p>No discounts found. Create your first discount!</p>
            )}
          </td>
        </tr>
      )}
    </tbody>
  );
};

export default DiscountTableBody;
