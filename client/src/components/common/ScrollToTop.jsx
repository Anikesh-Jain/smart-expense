import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Ensures that whenever the route or page parameters change,
 * the window and document scroll positions immediately reset to the top (scrollY = 0).
 * Also disables native browser scroll restoration on back/forward navigation.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Disable native browser scroll restoration so back/forward doesn't restore old scroll
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Reset window and document scroll positions immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Use requestAnimationFrame to ensure scroll is 0 after route DOM renders
    const rafId = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => cancelAnimationFrame(rafId);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
