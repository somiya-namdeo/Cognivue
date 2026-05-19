import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Reset main window scroll
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // 2. Reset nested scrollable containers (like main workspace panels in layouts)
    const scrollables = document.querySelectorAll('main, .overflow-y-auto');
    scrollables.forEach((el) => {
      el.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }, [pathname]);

  return null;
};
