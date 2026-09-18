import React, { useState, useEffect } from 'react';
import { THEME_MODES } from './themeConstants';
import { ThemeContext } from './themeContextInstance';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('smart_expense_theme') || THEME_MODES.DARK;
    } catch {
      return THEME_MODES.DARK;
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState(THEME_MODES.DARK);

  useEffect(() => {
    const updateTheme = () => {
      let active = theme;
      if (theme === THEME_MODES.SYSTEM) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = prefersDark ? THEME_MODES.DARK : THEME_MODES.LIGHT;
      }

      setResolvedTheme(active);

      const root = document.documentElement;
      if (active === THEME_MODES.LIGHT) {
        root.classList.remove('dark');
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === THEME_MODES.SYSTEM) {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('smart_expense_theme', newTheme);
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, changeTheme, THEME_MODES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
