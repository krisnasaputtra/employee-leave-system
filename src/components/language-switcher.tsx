"use client";

import { Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, type Locale } from "@/providers/locale-provider";

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
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-3 font-medium"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide" suppressHydrationWarning>
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
              className={`px-3 py-2.5 rounded-md ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : ""
              }`}
            >
              <span className="text-base mr-3">{lang.flag}</span>
              <span className="flex-1">{lang.label}</span>
              {isActive && <Check className="h-4 w-4 text-primary ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
