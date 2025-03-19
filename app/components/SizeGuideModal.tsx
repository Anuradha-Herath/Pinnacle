import React, { useRef, useEffect } from "react";
import { X, Ruler, ChevronRight, Maximize } from "lucide-react";
import Image from "next/image";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ 
  isOpen, 
  onClose,
  category = 'apparel' // Default to apparel sizing
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
      // Animate in
      if (contentRef.current) {
        contentRef.current.classList.remove('scale-95', 'opacity-0');
        contentRef.current.classList.add('scale-100', 'opacity-100');
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-all">
      <div 
        ref={contentRef}
        className="scale-95 opacity-0 transition-all duration-300 ease-in-out"
      >
        <div 
          ref={modalRef}
          className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 z-0"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-50 rounded-full -ml-20 -mb-20 z-0"></div>
          
          {/* Header with gradient */}
          <div className="relative z-10 flex justify-between items-center p-6 border-b bg-gradient-to-r from-white to-blue-50">
            <div className="flex items-center">
              <Ruler className="text-blue-500 mr-3" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Size Guide</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
              aria-label="Close size guide"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="overflow-auto max-h-[calc(90vh-80px)]">
            <div className="p-6 relative z-10">
              {/* Category tabs */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1 w-fit">
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${category === 'apparel' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                  onClick={() => {/* Category switch logic */}}
                >
                  Apparel
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${category === 'footwear' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                  onClick={() => {/* Category switch logic */}}
                >
                  Footwear
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg mr-2">
                      <Ruler size={18} />
                    </span>
                    Size Chart
                  </h3>
                  
                  <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-50 to-blue-100">
                          <th className="border-b px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Size</th>
                          <th className="border-b px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Chest (in)</th>
                          <th className="border-b px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Waist (in)</th>
                          <th className="border-b px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Hip (in)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">XS</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">31-33</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">25-27</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">34-36</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">S</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">34-36</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">28-30</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">37-39</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">M</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">37-39</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">31-33</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">40-42</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">L</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">40-42</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">34-36</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">43-45</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">XL</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">43-45</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">37-39</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">46-48</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">XXL</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">46-48</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">40-42</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">49-51</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg mr-2">
                      <Maximize size={18} />
                    </span>
                    How to Measure
                  </h3>
                  
                  <div className="bg-white border rounded-lg shadow-sm p-5 relative overflow-hidden">
                    {/* Measurement illustration */}
                    <div className="mb-6 flex justify-center">
                      <div className="relative h-40 w-52">
                        <Image 
                          src="/measuringguide.jpg" 
                          alt="Body measurement guide"
                          fill
                          className="object-contain"
                          onError={(e) => {
                            // Fallback if image doesn't exist
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                    
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2">
                          <span className="text-blue-600 text-xs font-bold">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Chest</h4>
                          <p className="text-sm text-gray-600">Measure around the fullest part of your chest, keeping the tape measure horizontal.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2">
                          <span className="text-blue-600 text-xs font-bold">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Waist</h4>
                          <p className="text-sm text-gray-600">Measure around your natural waistline, keeping the tape comfortably loose.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2">
                          <span className="text-blue-600 text-xs font-bold">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Hip</h4>
                          <p className="text-sm text-gray-600">Measure around the fullest part of your hips.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-gray-50 p-5 rounded-lg border border-blue-100">
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <ChevronRight size={18} className="text-blue-500 mr-1" />
                  Additional Notes
                </h3>
                <p className="text-sm text-gray-600">
                  This size chart is a general guide. Fit may vary depending on the construction, materials, and manufacturer. For the best fit, we recommend checking specific product measurements when available.
                </p>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;
