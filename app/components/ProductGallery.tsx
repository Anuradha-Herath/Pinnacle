import { useState, useRef } from "react";

interface ProductGalleryProps {
  onGalleryChange: (gallery: { src: string | ArrayBuffer | null; name: string; color: string }[]) => void;
  onMainImageRemove: (index: number) => void;
}

export default function ProductGallery({ onGalleryChange, onMainImageRemove }: ProductGalleryProps) {
  const [gallery, setGallery] = useState<{ src: string | ArrayBuffer | null; name: string; color: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach((file: File) => {
      const color = prompt(`Enter the color for ${file.name}:`);
      if (!color) {
        alert("Color is required!");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const result = event.target.result;
          const newGallery = [...gallery, { src: result, name: file.name, color }];
          setGallery(newGallery);
          onGalleryChange(newGallery);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const newGallery = gallery.filter((_, i) => i !== index);
    setGallery(newGallery);
    onGalleryChange(newGallery);
    if (index === 0) {
      onMainImageRemove(index);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Product Gallery <span className="text-red-500">*</span>
      </label>
      <div className="border-dashed border-2 border-gray-300 p-6 rounded-lg text-center">
        <input
          type="file"
          accept="image/jpeg, image/png, image/webp"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ADD IMAGE
        </button>
        <div className="text-gray-400 mt-2">
          Drop your images here, and type the color name.<br />
          JPEG, PNG, WEBP are allowed.<br />
          <span className="text-red-500">At least one image with color is required.</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map((item, index) => (
          <div key={index} className="relative border p-2 rounded-md">
            <img
              src={typeof item.src === 'string' ? item.src : undefined}
              alt={item.name}
              className="w-full h-32 object-cover rounded-md"
            />
            <p className="text-sm text-gray-700 mt-2">Color: {item.color}</p>
            <button
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}