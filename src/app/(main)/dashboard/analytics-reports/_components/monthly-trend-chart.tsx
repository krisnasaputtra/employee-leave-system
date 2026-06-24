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

const chartConfig = {
  APPROVED: { label: "Approved", color: "hsl(142, 71%, 45%)" },
  REJECTED: { label: "Rejected", color: "hsl(0, 84%, 60%)" },
  PENDING: { label: "Pending", color: "hsl(45, 93%, 47%)" },
  CANCELLED: { label: "Cancelled", color: "hsl(220, 9%, 46%)" },
} satisfies ChartConfig;

export function AnalyticsMonthlyTrendChart({ data }: MonthlyTrendChartProps) {
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
