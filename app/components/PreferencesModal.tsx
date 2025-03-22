"use client";

import React, { useState } from 'react';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { X } from 'lucide-react';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
  const { updatePreferredStyles, updatePreferredOccasions, updatePreferredColors } = useUserPreferences();
  
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  
  const styleOptions = ["Classic", "Modern", "Vintage", "Bohemian", "Minimalist", "Elegant", "Casual", "Trendy"];
  const occasionOptions = ["Casual", "Formal", "Business", "Party", "Wedding", "Beach", "Outdoor", "Sportswear"];
  const colorOptions = ["Black", "White", "Blue", "Red", "Green", "Yellow", "Purple", "Pink", "Brown", "Gray"];
  
  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };
  
  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions(prev => 
      prev.includes(occasion) 
        ? prev.filter(o => o !== occasion)
        : [...prev, occasion]
    );
  };
  
  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };
  
  const handleSubmit = () => {
    updatePreferredStyles(selectedStyles);
    updatePreferredOccasions(selectedOccasions);
    updatePreferredColors(selectedColors);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Personalize Your Experience</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Help us personalize your shopping experience by telling us your preferences.
            Our chatbot will use this information to provide better recommendations.
          </p>
          
          {/* Style preferences */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Your Style Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map(style => (
                <button
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    selectedStyles.includes(style)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          
          {/* Occasion preferences */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Occasions You Shop For</h3>
            <div className="flex flex-wrap gap-2">
              {occasionOptions.map(occasion => (
                <button
                  key={occasion}
                  onClick={() => toggleOccasion(occasion)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    selectedOccasions.includes(occasion)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {occasion}
                </button>
              ))}
            </div>
          </div>
          
          {/* Color preferences */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Color Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => toggleColor(color)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    selectedColors.includes(color)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;
