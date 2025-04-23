"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { saveUserMeasurements } from '@/lib/userPreferenceService';
import { toast } from 'react-hot-toast';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function SizeProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [measurements, setMeasurements] = useState({
    height: '',
    weight: '',
    chest: '',
    waist: '',
    hips: '',
    preferredFit: 'Regular Fit'
  });

  // Load existing measurements
  useEffect(() => {
    const loadMeasurements = async () => {
      // Simplified: In a real app, you might fetch this from an API for logged-in users
      try {
        const preferences = JSON.parse(localStorage.getItem('pinnacle_user_preferences') || '{}');
        const userMeasurements = preferences.userMeasurements || {};
        
        setMeasurements({
          height: userMeasurements.height?.toString() || '',
          weight: userMeasurements.weight?.toString() || '',
          chest: userMeasurements.chest?.toString() || '',
          waist: userMeasurements.waist?.toString() || '',
          hips: userMeasurements.hips?.toString() || '',
          preferredFit: userMeasurements.preferredFit || 'Regular Fit'
        });
      } catch (error) {
        console.error('Error loading measurements:', error);
      }
    };
    
    loadMeasurements();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMeasurements(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Parse numeric values
      const numericMeasurements = {
        height: measurements.height ? parseFloat(measurements.height) : undefined,
        weight: measurements.weight ? parseFloat(measurements.weight) : undefined,
        chest: measurements.chest ? parseFloat(measurements.chest) : undefined,
        waist: measurements.waist ? parseFloat(measurements.waist) : undefined,
        hips: measurements.hips ? parseFloat(measurements.hips) : undefined,
        preferredFit: measurements.preferredFit
      };
      
      const success = saveUserMeasurements(numericMeasurements);
      
      if (success) {
        toast.success('Size profile updated successfully');
      } else {
        toast.error('Failed to update size profile');
      }
    } catch (error) {
      console.error('Error saving measurements:', error);
      toast.error('An error occurred while saving your measurements');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">My Size Profile</h1>
        <p className="mb-6 text-gray-600">
          Save your measurements to get personalized size recommendations from our chatbot assistant.
          All measurements should be in inches or centimeters (choose one unit consistently).
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-md shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Height</label>
              <input
                type="number"
                name="height"
                value={measurements.height}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., 175 cm"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Weight</label>
              <input
                type="number"
                name="weight"
                value={measurements.weight}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., 70 kg"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Chest</label>
              <input
                type="number"
                name="chest"
                value={measurements.chest}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., 96 cm"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Waist</label>
              <input
                type="number"
                name="waist"
                value={measurements.waist}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., 82 cm"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Hips</label>
              <input
                type="number"
                name="hips"
                value={measurements.hips}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., 100 cm"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Preferred Fit</label>
              <select
                name="preferredFit"
                value={measurements.preferredFit}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="Slim Fit">Slim Fit</option>
                <option value="Regular Fit">Regular Fit</option>
                <option value="Relaxed Fit">Relaxed Fit</option>
                <option value="Oversized">Oversized</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Size Profile'}
            </button>
          </div>
        </form>
        
        <div className="mt-8 bg-orange-50 p-6 rounded-md border border-orange-100">
          <h2 className="text-lg font-semibold mb-2">Why save your measurements?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Get personalized size recommendations from our chatbot</li>
            <li>Never worry about ordering the wrong size again</li>
            <li>Save time when shopping by avoiding size uncertainty</li>
            <li>Your data is stored locally and not shared with third parties</li>
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
}
