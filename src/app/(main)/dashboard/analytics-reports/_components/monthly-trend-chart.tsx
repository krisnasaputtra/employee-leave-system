"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslation } from "@/providers/locale-provider";

export interface MonthlyTrendItem {
  month: string;
  APPROVED: number;
  REJECTED: number;
  PENDING: number;
  CANCELLED: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendItem[];
}

export function AnalyticsMonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const { t } = useTranslation();

  const chartConfig = {
    APPROVED: { label: t("status.approved"), color: "hsl(142, 71%, 45%)" },
    REJECTED: { label: t("status.rejected"), color: "hsl(0, 84%, 60%)" },
    PENDING: { label: t("status.pending"), color: "hsl(45, 93%, 47%)" },
    CANCELLED: { label: t("status.cancelled"), color: "hsl(220, 9%, 46%)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="APPROVED" stackId="a" fill="var(--color-APPROVED)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="REJECTED" stackId="a" fill="var(--color-REJECTED)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="PENDING" stackId="a" fill="var(--color-PENDING)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="CANCELLED" stackId="a" fill="var(--color-CANCELLED)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
