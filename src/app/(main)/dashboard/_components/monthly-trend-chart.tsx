"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface MonthlyTrendItem {
  month: string;
  count: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendItem[];
}

const chartConfig = {
  count: {
    label: "Leave Requests",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
