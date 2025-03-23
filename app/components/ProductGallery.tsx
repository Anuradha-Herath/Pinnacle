import React, { useState, useRef, ChangeEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface GalleryItem {
  src: string | ArrayBuffer | null;
  name: string;
  color: string;
}

interface ProductGalleryProps {
  onGalleryChange: (gallery: GalleryItem[]) => void;
  onMainImageRemove?: (index: number) => void;
  initialGallery?: GalleryItem[];
}

const commonColors = [
  { name: 'Red', value: 'red' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Black', value: 'black' },
  { name: 'White', value: 'white' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Purple', value: 'purple' },
  { name: 'Pink', value: 'pink' },
  { name: 'Orange', value: 'orange' },
  { name: 'Brown', value: 'brown' },
  { name: 'Grey', value: 'grey' },
  { name: 'Multicolor', value: 'multicolor' }
];

const ProductGallery: React.FC<ProductGalleryProps> = ({ onGalleryChange, onMainImageRemove, initialGallery = [] }) => {
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            // Try to detect color from filename
            const fileName = file.name.toLowerCase();
            const detectedColor = commonColors.find(color => 
              fileName.includes(color.value)
            )?.value || '';
            
            const newItem: GalleryItem = {
              src: event.target.result,
              name: file.name,
              color: detectedColor // Pre-fill detected color or leave empty
            };
            
            setGallery(prev => {
              const updatedGallery = [...prev, newItem];
              onGalleryChange(updatedGallery);
              return updatedGallery;
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Clear the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updatedGallery = [...gallery];
    updatedGallery.splice(index, 1);
    setGallery(updatedGallery);
    onGalleryChange(updatedGallery);
    
    if (onMainImageRemove && index === 0) {
      onMainImageRemove(index);
    }
  };

  const handleColorChange = (index: number, color: string) => {
    const updatedGallery = [...gallery];
    updatedGallery[index].color = color;
    setGallery(updatedGallery);
    onGalleryChange(updatedGallery);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Product Gallery <span className="text-red-500">*</span>
      </label>
      <div className="space-y-4">
        {/* Gallery items */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {gallery.map((item, index) => (
            <div key={index} className="border rounded-md p-2 relative">
              <div className="aspect-square bg-gray-100 mb-2">
                <img
                  src={typeof item.src === 'string' ? item.src : undefined}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Color selection with common colors dropdown */}
              <div className="mb-2">
                <label className="block text-xs text-gray-500 mb-1">Color:</label>
                <select
                  value={item.color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="w-full border rounded-md p-1 text-sm"
                >
                  <option value="">Select a color</option>
                  {commonColors.map(color => (
                    <option key={color.value} value={color.value}>{color.name}</option>
                  ))}
                </select>
                {!item.color && (
                  <p className="text-xs text-orange-500 mt-1">
                    Please select a color for this image
                  </p>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add image button */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center aspect-square cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-gray-500">+ Add Image</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="mt-2 text-sm text-gray-500">
        Add images with different colors of the product. Each image requires selecting a color.
        The chatbot uses this color information to recommend products.
      </div>
    </div>
  );
};

export default ProductGallery;
