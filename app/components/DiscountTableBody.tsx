import React from "react";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

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
}) => (
  <tbody>
    {discounts.length > 0 ? (
      discounts.map((discount) => (
        <tr key={discount._id} className="border-t">
          <td className="p-3">
            <div className="flex items-center">
              {itemDetails[discount.product] ? (
                <>
                  <div className="h-10 w-10 relative mr-3 overflow-hidden rounded bg-gray-100">
                    {loadingItems.has(discount.product) ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <img
                        src={itemDetails[discount.product].image}
                        alt={itemDetails[discount.product].name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                        loading="eager"
                      />
                    )}
                  </div>
                  <span className="font-medium">
                    {itemDetails[discount.product].name}
                  </span>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 relative mr-3 overflow-hidden rounded bg-gray-100 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span>{discount.product}</span>
                </>
              )}
            </div>
          </td>
          <td className="p-3">{discount.type}</td>
          <td className="p-3">{discount.percentage}%</td>
          <td className="p-3">{discount.startDate}</td>
          <td className="p-3">{discount.endDate}</td>
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
              {discount.status}
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
      ))
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

export default DiscountTableBody;
