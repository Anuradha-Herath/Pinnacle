"use client";

import { useEffect, useState } from "react";

export default function HeaderPlaceholder() {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isFixed, setIsFixed] = useState(false);
  
  useEffect(() => {
    // Get header height once mounted
    const header = document.querySelector('header');
    if (header) {
      setHeaderHeight(header.offsetHeight);
    }
    
    // Function to update placeholder height based on scroll position
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsFixed(scrollPosition >= 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', () => {});
    };
  }, []);
  
  return (
    <div 
      style={{ height: isFixed ? `${headerHeight}px` : '0px' }} 
      className="transition-all duration-300"
    />
  );
}
