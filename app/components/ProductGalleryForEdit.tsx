"use client";
import { useRef } from "react";

type GalleryItem = {
  src: string | ArrayBuffer | null;
  name: string;
  color: string;
};

export default function ProductGalleryForEdit({
  gallery,
  onGalleryUpdate,
  onImageRemove,
}: {
  gallery: GalleryItem[];
  onGalleryUpdate: (gallery: GalleryItem[]) => void;
  onImageRemove: (index: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: GalleryItem[] = [];

    Array.from(files).forEach((file) => {
      const color = prompt(`Enter color name for ${file.name}:`);
      if (!color) {
        alert("Color name is required!");
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        newItems.push({
          src: loadEvent.target?.result || null,
          name: file.name,
          color: color.trim(),
        });

        if (newItems.length === files.length) {
          onGalleryUpdate([...gallery, ...newItems]);
        }
      };
      reader.readAsDataURL(file);
    });
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
          onChange={handleAddImages}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ADD IMAGE
        </button>
        <div className="text-gray-400 mt-2">
          Drop your images here, and type the color name.
          <br />
          JPEG, PNG, WEBP are allowed.
          <br />
          <span className="text-red-500">
            At least one image with color is required.
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map((item, index) => (
          <div key={index} className="relative border p-2 rounded-md">
            <img
              src={typeof item.src === "string" ? item.src : ""}
              alt={item.name}
              className="w-full h-32 object-cover rounded-md"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-center">
              <span className="text-white text-sm">{item.color}</span>
            </div>
            <button
              onClick={() => onImageRemove(index)}
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
