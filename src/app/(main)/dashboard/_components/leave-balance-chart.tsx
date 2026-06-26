"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useTranslation } from "@/providers/locale-provider";

interface LeaveBalanceChartProps {
  used: number;
  pending: number;
  remaining: number;
}

const BALANCE_COLORS = {
  used: "hsl(0, 84%, 60%)",
  pending: "hsl(45, 93%, 47%)",
  remaining: "hsl(142, 71%, 45%)",
};

const chartConfig = {
  days: { label: "Days" },
  used: { label: "Used", color: BALANCE_COLORS.used },
  pending: { label: "Pending", color: BALANCE_COLORS.pending },
  remaining: { label: "Remaining", color: BALANCE_COLORS.remaining },
} satisfies ChartConfig;

export function LeaveBalanceChart({ used, pending, remaining }: LeaveBalanceChartProps) {
  const { t } = useTranslation();
  const total = used + pending + remaining;
  const chartData = [
    { name: "Used", days: used, fill: BALANCE_COLORS.used },
    { name: "Pending", days: pending, fill: BALANCE_COLORS.pending },
    { name: "Remaining", days: remaining, fill: BALANCE_COLORS.remaining },
  ].filter((d) => d.days > 0);

  if (total === 0) {
    return <p className="py-4 text-center text-muted-foreground text-sm">{t("dashboard.noLeaveBalanceData")}</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[180px]">
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie data={chartData} dataKey="days" nameKey="name" innerRadius={40} strokeWidth={4}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground font-bold text-xl">
                      {remaining}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} className="fill-muted-foreground text-[10px]">
                      {t("dashboard.remaining")}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
