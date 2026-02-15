import { createContext, useState, useEffect, ReactNode } from 'react';
import {
  ThemeMode,
  getStoredThemeMode,
  setStoredThemeMode,
  resolveEffectiveTheme,
  createSystemThemeListener,
} from '../lib/themeMode';

interface ThemeModeContextValue {
  mode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

interface ThemeModeProviderProps {
  children: ReactNode;
}

export function ThemeModeProvider({ children }: ThemeModeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return getStoredThemeMode() || 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    return resolveEffectiveTheme(mode);
  });

  // Update effective theme when mode changes
  useEffect(() => {
    const newEffective = resolveEffectiveTheme(mode);
    setEffectiveTheme(newEffective);
  }, [mode]);

  // Apply dark class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  // Listen to system theme changes when in system mode
  useEffect(() => {
    if (mode !== 'system') return;

    const cleanup = createSystemThemeListener(() => {
      const newEffective = resolveEffectiveTheme('system');
      setEffectiveTheme(newEffective);
    });

    return cleanup;
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    setStoredThemeMode(newMode);
  };

  return (
    <ThemeModeContext.Provider value={{ mode, effectiveTheme, setMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
}
