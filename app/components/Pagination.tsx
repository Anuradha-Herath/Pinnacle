import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) => (
  <div className="flex justify-center mt-6">
    <div className="flex items-center gap-2">
      <button
        className={`px-4 py-2 rounded-md ${
          currentPage === 1
            ? "bg-orange-200 text-gray-700 cursor-not-allowed"
            : "bg-orange-500 text-white hover:bg-orange-600"
        }`}
        onClick={onPrevious}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <span className="mx-2 text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className={`px-4 py-2 rounded-md ${
          currentPage === totalPages
            ? "bg-orange-200 text-gray-700 cursor-not-allowed"
            : "bg-orange-500 text-white hover:bg-orange-600"
        }`}
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  </div>
);

export default Pagination;
