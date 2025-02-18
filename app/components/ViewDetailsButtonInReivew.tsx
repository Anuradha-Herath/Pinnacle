import Link from 'next/link';
import React from 'react';

const ReviewButton = ({ status }: { status: string }) => {  
    if (status === "Delivered") {
        return (
          <div className="text-right mt-2">
            <Link href="/toreview">
              <button className="text-sm bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 mb-1">
                Review This Item
              </button>
            </Link>
          </div>
        );
      }
      return null;
}

export default ReviewButton;
