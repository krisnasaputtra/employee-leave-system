"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useTranslation } from "@/providers/locale-provider";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface DepartmentChartItem {
  department: string;
  totalDays: number;
}

interface DepartmentChartProps {
  data: DepartmentChartItem[];
}

const chartConfig = {
  totalDays: {
    label: "Total Leave Days",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig;

export function DepartmentUtilizationChart({ data }: DepartmentChartProps) {
  const { t } = useTranslation();
  if (data.length === 0) {
    return <p className="py-4 text-center text-muted-foreground text-sm">{t("analytics.noDepartmentData")}</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full" style={{ minHeight: Math.max(250, data.length * 45) }}>
      <BarChart data={data} layout="vertical" accessibilityLayer margin={{ left: 20 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis dataKey="department" type="category" tickLine={false} axisLine={false} width={120} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="totalDays" fill="var(--color-totalDays)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
