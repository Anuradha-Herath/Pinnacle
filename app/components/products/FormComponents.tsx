import React from 'react';

// Reusable input field component
export const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder = '',
  className = ''
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) => (
  <div className={className}>
    <label className="block text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// Reusable textarea component
export const FormTextArea = ({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = '',
  rows = 4,
  className = ''
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}) => (
  <div className={className}>
    <label className="block text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
    ></textarea>
  </div>
);

// Reusable select dropdown component
export const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  className = ''
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) => (
  <div className={className}>
    <label className="block text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Checkbox button group component
export const CheckboxButtonGroup = ({
  label,
  options,
  selectedValues,
  onChange,
  colorScheme = 'gray',
  required = false,
  className = ''
}: {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (value: string) => void;
  colorScheme?: 'blue' | 'purple' | 'green' | 'gray';
  required?: boolean;
  className?: string;
}) => {
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => onChange(option.value)}
              className="hidden"
            />
            <span
              className={`inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md border border-gray-300 cursor-pointer ${
                selectedValues.includes(option.value)
                  ? `${getColorClasses()} text-white`
                  : "bg-gray-100"
              }`}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

// Size chart image uploader component
export const SizeChartUploader = ({
  sizeChartImage,
  onUpload,
  onRemove
}: {
  sizeChartImage: string | ArrayBuffer | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  return (
    <div className="border-t pt-4 mt-4">
      <label className="block text-sm font-medium mb-2">Size Chart Image</label>
      <div className="mt-2">
        <input
          type="file"
          ref={fileInputRef}
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
            onClick={() => fileInputRef.current?.click()}
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
};
