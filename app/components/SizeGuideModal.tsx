import React, { useRef, useEffect, useState } from "react";
import { X, Ruler, ChevronRight } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  sizeChartImage?: string; // Add prop for product-specific size chart image
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  category = "apparel", // Default to apparel sizing
  sizeChartImage, // Accept size chart image from props
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [gender, setGender] = useState<"women" | "men">("women"); // Toggle between men's and women's sizing

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
      if (contentRef.current) {
        contentRef.current.classList.remove("scale-95", "opacity-0");
        contentRef.current.classList.add("scale-100", "opacity-100");
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscKey);
    }

    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Size data for women (from the image)
  const womenSizeData = [
    { size: "XS", ukSize: "6", length: "27", width: "22" },
    { size: "S", ukSize: "8", length: "28", width: "23" },
    { size: "M", ukSize: "10", length: "29", width: "24" },
    { size: "L", ukSize: "12", length: "30", width: "25" },
    { size: "XL", ukSize: "14", length: "31", width: "26" },
    { size: "XXL", ukSize: "16", length: "32", width: "27" },
  ];

  // Size data for men (adjusted for demonstration; replace with actual data if available)
  const menSizeData = [
    { size: "XS", ukSize: "6", length: "28", width: "23" },
    { size: "S", ukSize: "8", length: "29", width: "24" },
    { size: "M", ukSize: "10", length: "30", width: "25" },
    { size: "L", ukSize: "12", length: "31", width: "26" },
    { size: "XL", ukSize: "14", length: "32", width: "27" },
    { size: "XXL", ukSize: "16", length: "33", width: "28" },
  ];

  // Select the size data based on the current gender
  const currentSizeData = gender === "women" ? womenSizeData : menSizeData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 transition-all">
      <div
        ref={contentRef}
        className="scale-95 opacity-0 transition-all duration-300 ease-in-out"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-lg border border-gray-200"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Ruler className="text-gray-700 mr-2" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Pinnacle Size Guide</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
              aria-label="Close size guide"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-auto max-h-[calc(80vh-64px)]">
            <div className="p-6">
              <div className="grid md:grid-cols-1 gap-6">
                {/* If product has a specific size chart, show it */}
                {sizeChartImage ? (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <ChevronRight size={16} className="text-gray-500 mr-1" />
                      Product-Specific Size Chart
                    </h3>
                    <img
                      src={sizeChartImage}
                      alt="Product Size Chart"
                      className="w-full rounded-md border border-gray-200"
                    />
                  </div>
                ) : (
                  <div>
                    <img
                      src="/SizeguidemodelImage.png"
                      alt="Size guide"
                      className="w-full rounded-md border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-1 flex items-center">
                  <ChevronRight size={16} className="text-gray-500 mr-1" />
                  Additional Notes
                </h3>
                <p className="text-sm text-gray-600">
                  Pinnacle sizes may vary slightly by collection. For a precise fit, measure carefully and consult specific product details. If between sizes, consider sizing up for a relaxed fit or down for a tailored silhouette.
                </p>
              </div>

              <div className="mt-6 flex justify-end px-6 pb-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;