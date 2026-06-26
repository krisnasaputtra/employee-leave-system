"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import { useTranslation } from "@/providers/locale-provider";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface LeaveTypeChartItem {
  name: string;
  count: number;
  color: string;
  percentage: number;
}

interface LeaveTypeChartProps {
  data: LeaveTypeChartItem[];
  totalRequests: number;
}

export function LeaveTypeDistributionChart({ data, totalRequests }: LeaveTypeChartProps) {
  const { t } = useTranslation();
  const chartConfig = data.reduce<ChartConfig>((acc, item) => {
    acc[item.name] = { label: item.name, color: item.color };
    return acc;
  }, { count: { label: "Requests" } });

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[320px]">
      <PieChart accessibilityLayer>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="name"
              formatter={(value, name) => (
                <span>
                  {name}: {value} ({data.find((d) => d.name === name)?.percentage ?? 0}%)
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={70} strokeWidth={5}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground font-bold text-3xl">
                      {totalRequests}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className="fill-muted-foreground text-sm">
                      {t("common.total")}
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
