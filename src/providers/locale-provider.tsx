"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import enMessages from "@/locales/en.json";
import idMessages from "@/locales/id.json";

export type Locale = "en" | "id";
type Messages = typeof enMessages;

const MESSAGES: Record<Locale, Messages> = {
  en: enMessages,
  id: idMessages,
};

const STORAGE_KEY = "app-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // fallback to key if not found
    }
  }
  return typeof current === "string" ? current : path;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Always start with "en" to match server render and avoid hydration mismatch.
  // After hydration, useEffect reads the stored preference from localStorage.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "id") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(MESSAGES[locale] as unknown as Record<string, unknown>, key);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}

export function useTranslation() {
  const { t } = useLocale();
  return { t };
}
