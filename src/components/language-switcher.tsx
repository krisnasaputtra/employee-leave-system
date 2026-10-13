"use client";

import { Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale, useLocale } from "@/providers/locale-provider";

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const currentLang = LANGUAGES.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-3 font-medium" aria-label="Change language">
          <Globe className="h-4 w-4" />
          <span className="font-semibold text-xs uppercase tracking-wide" suppressHydrationWarning>
            {currentLang?.code ?? "en"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px] p-1.5">
        {LANGUAGES.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLocale(lang.code)}
              className={`rounded-md px-3 py-2.5 ${isActive ? "bg-primary/10 font-semibold text-primary" : ""}`}
            >
              <span className="mr-3 text-base">{lang.flag}</span>
              <span className="flex-1">{lang.label}</span>
              {isActive && <Check className="ml-2 h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
