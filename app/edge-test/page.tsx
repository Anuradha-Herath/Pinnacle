"use client";

import { useState } from 'react';
import { getBrowserInfo } from '@/lib/browserUtils';

export default function EdgeTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const browserInfo = getBrowserInfo();
    console.log('Browser Info:', browserInfo);
    
    const tests = [
      { name: 'Health Check', url: '/api/health' },
      { name: 'Categories API', url: '/api/categories' },
      { name: 'Products API', url: '/api/customer/products' },
      { name: 'Trending API', url: '/api/customer/trending' },
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}...`);
        
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(test.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          credentials: 'same-origin',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const endTime = Date.now();
        
        const result = {
          name: test.name,
          url: test.url,
          status: response.status,
          success: response.ok,
          responseTime: endTime - startTime,
          error: null,
        };
        
        results.push(result);
        setTestResults([...results]);
        
      } catch (error) {
        const result = {
          name: test.name,
          url: test.url,
          status: 0,
          success: false,
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        
        results.push(result);
        setTestResults([...results]);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Edge Browser Compatibility Test
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Browser Information</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm">
            {JSON.stringify(getBrowserInfo(), null, 2)}
          </pre>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">API Tests</h2>
            <button
              onClick={runTests}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>
          
          {testResults.length > 0 && (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${
                    result.success
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{result.name}</h3>
                      <p className="text-sm text-gray-600">{result.url}</p>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          result.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {result.success ? 'PASS' : 'FAIL'}
                      </span>
                      {result.success && (
                        <p className="text-xs text-gray-500 mt-1">
                          {result.responseTime}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Open this page in Edge browser</li>
            <li>Click "Run Tests" to test all API endpoints</li>
            <li>Verify that all tests pass</li>
            <li>Check the browser console for any additional debug information</li>
            <li>Compare results with Chrome browser to ensure consistency</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
