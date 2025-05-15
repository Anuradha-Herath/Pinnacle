import React, { useRef } from "react";

interface SizeChartUploaderProps {
  sizeChartImage: string | ArrayBuffer | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export default function SizeChartUploader({
  sizeChartImage,
  onUpload,
  onRemove
}: SizeChartUploaderProps) {
  const sizeChartInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-t pt-4 mt-4">
      <label className="block text-sm font-medium mb-2">Size Chart Image</label>
      <div className="mt-2">
        <input
          type="file"
          ref={sizeChartInputRef}
          accept="image/*"
          onChange={onUpload}
          className="hidden"
        />
        
        {sizeChartImage ? (
          <div className="relative border rounded-md p-2">
            <img
              src={typeof sizeChartImage === 'string' ? sizeChartImage : ''}
              alt="Size Chart"
              className="max-h-48 mx-auto"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => sizeChartInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center hover:border-blue-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="mt-2 text-sm text-gray-500">Upload Size Chart</span>
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Upload a detailed size chart image for this product. This will help customers find their perfect fit.
      </p>
    </div>
  );
}
