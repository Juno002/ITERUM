import { useEffect, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './theme-context';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const saved = window.localStorage.getItem('iterum_theme');
  if (saved === 'light' || saved === 'dark') return saved;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return getInitialTheme();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem('iterum_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
