import React, { useRef, useState, useCallback } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

interface AdditionalImage {
  id: string; // Add unique ID for each image
  src: string | ArrayBuffer | null;
  name: string;
}

interface GalleryItem {
  src: string | ArrayBuffer | null;
  name: string;
  color: string;
  additionalImages?: AdditionalImage[];
}

interface ProductGalleryProps {
  gallery: GalleryItem[];
  onAddImages: (newItems: GalleryItem[]) => void;
  onRemoveImage: (index: number) => void;
  onUpdateColor: (index: number, color: string) => void;
  onAddAdditionalImage: (colorIndex: number, newImage: AdditionalImage) => void;
  onRemoveAdditionalImage: (colorIndex: number, imageIndex: number) => void;
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
  gallery,
  onAddImages,
  onRemoveImage,
  onUpdateColor,
  onAddAdditionalImage,
  onRemoveAdditionalImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedColorIndex, setExpandedColorIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null);
  
  // Handler for main color image uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files).map(file => {
      return new Promise<GalleryItem>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            src: reader.result,
            name: file.name,
            color: '',
            additionalImages: []
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newFiles).then(newItems => {
      onAddImages(newItems);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  // Toggle color expansion
  const toggleColorExpansion = (index: number) => {
    setExpandedColorIndex(expandedColorIndex === index ? null : index);
  };

  // Completely redesigned additional image upload function using memoization
  const handleUploadAdditionalImage = useCallback((colorIndex: number) => {
    // Prevent uploads if already in progress
    if (isUploading || activeColorIndex !== null) return;
    
    setActiveColorIndex(colorIndex);
    setIsUploading(true);
    
    // Create file input programmatically for this specific upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    // Important: Only allow single file selection to prevent duplication issues
    fileInput.multiple = false;
    
    // Set up change listener
    fileInput.addEventListener('change', function handleFileSelect() {
      if (!this.files || this.files.length === 0) {
        setIsUploading(false);
        setActiveColorIndex(null);
        return;
      }
      
      // Get the file
      const file = this.files[0];
      
      // Generate a unique ID for this image to prevent duplicates
      const uniqueId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Read the file
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          // Add with unique ID
          onAddAdditionalImage(colorIndex, {
            id: uniqueId,
            src: loadEvent.target.result,
            name: file.name
          });
        }
        
        // Reset upload state
        setIsUploading(false);
        setActiveColorIndex(null);
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        setIsUploading(false);
        setActiveColorIndex(null);
      };
      
      // Start reading
      reader.readAsDataURL(file);
      
      // Remove the event listener to prevent memory leaks
      fileInput.removeEventListener('change', handleFileSelect);
    });
    
    // Trigger file selection dialog
    fileInput.click();
  }, [isUploading, activeColorIndex, onAddAdditionalImage]);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Product Colors <span className="text-red-500">*</span>
      </label>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {gallery.map((item, index) => (
            <div key={index} className="border rounded-md p-2 relative">
              {/* Main image */}
              <div className="aspect-square bg-gray-100 mb-2">
                <img
                  src={typeof item.src === 'string' ? item.src : undefined}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Color selection */}
              <div className="mb-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Color:
                </label>
                <select
                  value={item.color}
                  onChange={(e) => onUpdateColor(index, e.target.value)}
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

              {/* Expand/collapse and remove buttons */}
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={() => toggleColorExpansion(index)}
                  className="text-sm text-blue-600 hover:underline flex items-center"
                >
                  {expandedColorIndex === index ? 'Hide' : 'Show'} additional images 
                  {item.additionalImages && item.additionalImages.length > 0 && 
                    ` (${item.additionalImages.length})`}
                </button>
                
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="bg-red-500 text-white p-1 rounded-full"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              
              {/* Additional images section */}
              {expandedColorIndex === index && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Additional Images</div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {/* Show additional images if they exist */}
                    {item.additionalImages && item.additionalImages.length > 0 ? (
                      item.additionalImages.map((img, imgIndex) => (
                        <div key={img.id || imgIndex} className="relative">
                          <img
                            src={typeof img.src === 'string' ? img.src : undefined}
                            alt={img.name}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveAdditionalImage(index, imgIndex)}
                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-sm text-gray-400 py-2">
                        No additional images yet
                      </div>
                    )}
                    
                    {/* Button to add additional images */}
                    <div 
                      onClick={() => !isUploading && handleUploadAdditionalImage(index)}
                      className={`flex items-center justify-center h-20 bg-gray-100 rounded cursor-pointer ${
                        isUploading && activeColorIndex === index ? 'opacity-50' : 'hover:bg-gray-200'
                      }`}
                    >
                      {isUploading && activeColorIndex === index ? (
                        <span className="text-xs text-gray-500">Uploading...</span>
                      ) : (
                        <PlusIcon className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Add new color option button */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center aspect-square cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-gray-500">+ Add Color Option</span>
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
        Add main color images first, then expand each color to add additional product images for that color.
      </div>
    </div>
  );
};

export default ProductGallery;
