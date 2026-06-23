import type { ReactNode } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Review Checklist | LRM",
  description:
    "Comprehensive code review checklist for the Leave Request Management System — Next.js + Supabase",
};

export default function CodeReviewLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
