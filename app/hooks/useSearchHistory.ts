import { useState, useEffect, useCallback } from 'react';

const MAX_HISTORY_ITEMS = 5;
const STORAGE_KEY = 'searchHistory';

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load search history from localStorage when component mounts
  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          if (Array.isArray(parsedHistory)) {
            setSearchHistory(parsedHistory);
          }
        } catch (error) {
          console.error('Error parsing search history:', error);
          // If there's an error parsing, reset the history
          localStorage.removeItem(STORAGE_KEY);
          setSearchHistory([]);
        }
      }
      setInitialized(true);
    };
    
    loadHistory();
  }, []);

  // Add a search term to history - using useCallback to avoid unnecessary function recreations
  const addToHistory = useCallback((term: string) => {
    if (!term.trim() || !initialized) return;
    
    setSearchHistory(prev => {
      // Remove the term if it already exists (to avoid duplicates)
      const filtered = prev.filter(item => item.toLowerCase() !== term.toLowerCase());
      
      // Add the new term at the beginning and limit to MAX_HISTORY_ITEMS
      const newHistory = [term, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      
      return newHistory;
    });
  }, [initialized]);

  // Clear the entire search history - using useCallback
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSearchHistory([]);
  }, []);

  // Remove a specific item from history - using useCallback
  const removeFromHistory = useCallback((term: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== term);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  return { searchHistory, addToHistory, clearHistory, removeFromHistory };
}
