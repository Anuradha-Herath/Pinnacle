"use client";

import React, { useState } from 'react';

export default function GeminiTestPage() {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [checkingModels, setCheckingModels] = useState(false);

  const testGeminiApi = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const res = await fetch('/api/gemini/test');
      const data = await res.json();
      
      if (data.success) {
        setResponse(data.response);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError('Failed to connect to the API endpoint');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailableModels = async () => {
    setCheckingModels(true);
    setModelInfo(null);
    
    try {
      const res = await fetch('/api/gemini/models');
      const data = await res.json();
      
      setModelInfo(data);
    } catch (err) {
      console.error(err);
      setModelInfo({
        error: 'Failed to check model availability'
      });
    } finally {
      setCheckingModels(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Gemini API Test</h1>
        
        <div className="mb-8 flex gap-4">
          <button 
            onClick={testGeminiApi}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Gemini API'}
          </button>
          
          <button 
            onClick={checkAvailableModels}
            disabled={checkingModels}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {checkingModels ? 'Checking...' : 'Check Available Models'}
          </button>
        </div>
        
        {loading && (
          <div className="mb-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {response && (
          <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-3">Response from Gemini:</h2>
            <div className="bg-black/30 p-4 rounded whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
        
        {checkingModels && (
          <div className="mb-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {modelInfo && (
          <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-3">Model Availability:</h2>
            {modelInfo.error ? (
              <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg">
                <strong>Error:</strong> {modelInfo.error}
              </div>
            ) : (
              <div className="bg-black/30 p-4 rounded">
                <p className="mb-2">API Version: {modelInfo.apiVersion}</p>
                {modelInfo.modelResults && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Model Status:</h3>
                    {Object.entries(modelInfo.modelResults).map(([modelName, result]: [string, any]) => (
                      <div key={modelName} className="mb-3 p-3 bg-gray-800 rounded">
                        <div className="flex justify-between">
                          <strong>{modelName}</strong> 
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            result.status === "available" 
                              ? "bg-green-900 text-green-200" 
                              : "bg-red-900 text-red-200"
                          }`}>
                            {result.status}
                          </span>
                        </div>
                        {result.error && (
                          <div className="text-red-400 text-sm mt-1">
                            {result.error}
                          </div>
                        )}
                        {result.response && (
                          <div className="text-gray-400 text-sm mt-1">
                            Sample response: {result.response}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 text-sm text-gray-400">
          <p>This page tests if your Gemini API key is working correctly.</p>
          <p>If you're getting 404 errors, try using "Check Available Models" to find which models your API key can access.</p>
          <p>Make sure your API key is configured correctly and has access to Gemini models.</p>
        </div>
      </div>
    </div>
  );
}
