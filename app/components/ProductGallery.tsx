import React, { useState, useRef, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface GalleryItem {
  src: string | ArrayBuffer | null;
  name: string;
  color: string;
}

interface ProductGalleryProps {
  initialGallery?: GalleryItem[];
  onGalleryChange: (gallery: GalleryItem[]) => void;
  onMainImageRemove?: (index: number) => void;
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

const ProductGallery: React.FC<ProductGalleryProps> = ({
  onGalleryChange,
  onMainImageRemove,
  initialGallery = []
}) => {
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use a ref to track if this is the initial render or a gallery update
  const initialRenderRef = useRef(true);
  const prevGalleryRef = useRef<GalleryItem[]>([]);
  
  // Only notify parent of changes when gallery actually changes and not on initial render
  useEffect(() => {
    // Skip the first render
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      prevGalleryRef.current = gallery;
      return;
    }
    
    // Check if gallery has actually changed before calling onGalleryChange
    const prevGallery = prevGalleryRef.current;
    if (
      gallery.length !== prevGallery.length || 
      JSON.stringify(gallery) !== JSON.stringify(prevGallery)
    ) {
      prevGalleryRef.current = gallery;
      onGalleryChange(gallery);
    }
  }, [gallery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => {
        return new Promise<GalleryItem>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              src: reader.result,
              name: file.name,
              color: ''
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newFiles).then(newItems => {
        setGallery(prev => [...prev, ...newItems]);
      });

      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    setGallery(prev => {
      const newGallery = [...prev];
      newGallery.splice(index, 1);
      return newGallery;
    });
    
    if (onMainImageRemove) {
      onMainImageRemove(index);
    }
  };

  const handleColorChange = (index: number, color: string) => {
    setGallery(prev => {
      const newGallery = [...prev];
      newGallery[index] = { ...newGallery[index], color };
      return newGallery;
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Product Gallery <span className="text-red-500">*</span>
      </label>
      <div className="space-y-4">
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

              <div className="mb-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Color:
                </label>
                <select
                  value={item.color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="w-full border rounded-md p-1 text-sm"
                >
                  <option value="">Select a color</option>
                  {commonColors.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.name}
                    </option>
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
          multiple={true}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Add images with different colors of the product. Each image requires selecting a color. The chatbot uses this color information to recommend products.
      </div>
    </div>
  );
};

export default ProductGallery;
