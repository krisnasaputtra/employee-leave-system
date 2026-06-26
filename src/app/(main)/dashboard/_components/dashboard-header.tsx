"use client";

import { useTranslation } from "@/providers/locale-provider";

interface DashboardHeaderProps {
  fullName: string;
  role: string;
  position: string;
}

export function DashboardHeader({ fullName, role, position }: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="font-semibold text-2xl tracking-tight">
        {t("dashboard.welcome")}, {fullName}
      </h1>
      <p className="text-muted-foreground text-sm">
        {t("dashboard.signedInAs")} <span className="font-medium">{role}</span>
        {" · "}
        {position}
      </p>
    </div>
  );
}
