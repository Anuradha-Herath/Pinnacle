import { useState, useEffect } from "react";

interface Category {
  _id: string;
  title: string;
  mainCategory: string[];
}

export function useCategories(selectedMainCategory: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/categories");
        
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter subcategories based on selected main category
  useEffect(() => {
    if (selectedMainCategory) {
      const filtered = categories.filter(
        (cat) => cat.mainCategory && cat.mainCategory.includes(selectedMainCategory)
      );
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories([]);
    }
  }, [selectedMainCategory, categories]);

  return { 
    categories, 
    filteredSubCategories, 
    loading, 
    error 
  };
}
