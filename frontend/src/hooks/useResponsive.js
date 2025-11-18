import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design utilities
 * Provides scaling factors and breakpoint detection for consistent UI across screen sizes
 */
export const useResponsive = () => {
  const [screenInfo, setScreenInfo] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    scaleFactor: 1
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Base dimensions for 27" 1080p monitor
      const baseWidth = 1920;
      const baseHeight = 1080;
      
      // Calculate scale factor based on viewport
      let scaleFactor = Math.min(width / baseWidth, height / baseHeight);
      
      // Clamp scale factor for different screen sizes
      if (width < 768) {
        scaleFactor = 1; // Mobile uses original sizing
      } else if (width < 1024) {
        scaleFactor = Math.max(0.8, scaleFactor); // Tablet minimum
      } else {
        scaleFactor = Math.max(0.7, Math.min(1.5, scaleFactor)); // Desktop range
      }

      setScreenInfo({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        scaleFactor
      });
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    return () => window.removeEventListener('resize', updateScreenInfo);
  }, []);

  // Helper functions for responsive values
  const scale = (value) => {
    if (screenInfo.isMobile) return value;
    return Math.round(value * screenInfo.scaleFactor);
  };

  const fontSize = (size) => {
    if (screenInfo.isMobile) return `${size}px`;
    return `calc(${size}px * var(--scale-factor, 1))`;
  };

  const spacing = (size) => {
    if (screenInfo.isMobile) return `${size}px`;
    return `calc(${size}px * var(--scale-factor, 1))`;
  };

  return {
    ...screenInfo,
    scale,
    fontSize,
    spacing
  };
};

/**
 * Responsive style generator
 * Creates CSS-in-JS styles that scale appropriately
 */
export const createResponsiveStyles = (styles, isMobile = false) => {
  if (isMobile) return styles;
  
  const responsiveStyles = {};
  
  Object.keys(styles).forEach(key => {
    const value = styles[key];
    
    if (typeof value === 'string') {
      // Handle pixel values
      if (value.includes('px')) {
        const numValue = parseInt(value);
        responsiveStyles[key] = `calc(${numValue}px * var(--scale-factor, 1))`;
      }
      // Handle em/rem values
      else if (value.includes('em')) {
        responsiveStyles[key] = value;
      }
      // Handle other values as-is
      else {
        responsiveStyles[key] = value;
      }
    } else {
      responsiveStyles[key] = value;
    }
  });
  
  return responsiveStyles;
};