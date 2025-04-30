import React, { useRef, useEffect, useState } from "react";
import { X, Ruler, ChevronRight } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChartImage?: string; // Optional prop for product-specific size chart image
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  sizeChartImage,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
              <h2 className="text-xl font-semibold text-gray-900">Size Guide</h2>
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
              {/* Product-Specific Size Chart or Fallback Message */}
              <div>
                {sizeChartImage ? (
                  <img
                    src={sizeChartImage}
                    alt="Product Size Chart"
                    className="w-full rounded-md border border-gray-200"
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium">No Specific Size Chart</h3>
                    <p className="mt-1">There is no size chart available for this product.</p>
                  </div>
                )}
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