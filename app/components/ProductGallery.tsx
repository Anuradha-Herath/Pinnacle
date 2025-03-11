import React, { useState, useRef } from 'react';

interface GalleryItem {
  src: string | ArrayBuffer | null;
  name: string;
  color: string;
}

interface ProductGalleryProps {
  onGalleryChange: (gallery: GalleryItem[]) => void;
  onMainImageRemove?: (index: number) => void;
  existingGallery?: GalleryItem[];
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ 
  onGalleryChange, 
  onMainImageRemove,
  existingGallery = [] 
}) => {
  const [gallery, setGallery] = useState<GalleryItem[]>(existingGallery);
  const [currentName, setCurrentName] = useState<string>('');
  const [currentColor, setCurrentColor] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // Don't add to gallery yet, wait for color input
        setCurrentName(file.name);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleColorSubmit = () => {
    if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
      const file = fileInputRef.current.files[0];
      
      if (!currentColor) {
        alert("Please enter a color name");
        return;
      }
      
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const newItem: GalleryItem = {
          src: reader.result,
          name: currentName,
          color: currentColor
        };
        
        const updatedGallery = [...gallery, newItem];
        setGallery(updatedGallery);
        onGalleryChange(updatedGallery);
        
        // Reset inputs
        setCurrentName('');
        setCurrentColor('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (index: number) => {
    const updatedGallery = gallery.filter((_, i) => i !== index);
    setGallery(updatedGallery);
    onGalleryChange(updatedGallery);
    if (onMainImageRemove) {
      onMainImageRemove(index);
    }
  };

  const predefinedColors = [
    "Black", "White", "Red", "Blue", "Green", "Yellow", 
    "Purple", "Pink", "Orange", "Gray", "Brown", "Beige"
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          Product Gallery <span className="text-red-500">*</span>
        </label>
      </div>
      
      {/* Image selection and color input */}
      <div className="border p-4 rounded-md bg-gray-50 space-y-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        
        {currentName && (
          <div className="space-y-3">
            <p className="text-sm">Selected file: {currentName}</p>
            
            {/* Color input field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Product Color <span className="text-red-500">*</span>
              </label>
              
              {/* Color selection buttons */}
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCurrentColor(color)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentColor === color 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              
              {/* Custom color input */}
              <div className="flex mt-2">
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  placeholder="Enter color name"
                  className="flex-1 p-2 border rounded-l-md"
                />
                <button
                  type="button"
                  onClick={handleColorSubmit}
                  className="bg-orange-600 text-white px-4 py-2 rounded-r-md hover:bg-orange-700"
                >
                  Add to Gallery
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!currentName && (
          <button
            type="button"
            onClick={handleAddImage}
            className="w-full py-3 border-2 border-dashed rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center"
          >
            <span>Add Product Image</span>
          </button>
        )}
      </div>
      
      {/* Gallery display */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery.map((item, index) => (
          <div 
            key={index} 
            className="relative group border rounded-md overflow-hidden h-24"
          >
            {item.src && typeof item.src === 'string' && (
              <img 
                src={item.src} 
                alt={`Gallery ${index}`} 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
              {item.color}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
