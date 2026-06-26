"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useTranslation } from "@/providers/locale-provider";

interface StatusDistributionItem {
  status: string;
  count: number;
}

interface StatusDistributionChartProps {
  data: StatusDistributionItem[];
  totalRequests: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "hsl(45, 93%, 47%)",    // amber
  APPROVED: "hsl(142, 71%, 45%)",  // green
  REJECTED: "hsl(0, 84%, 60%)",    // red
  CANCELLED: "hsl(220, 9%, 46%)",  // gray
};

const chartConfig = {
  count: { label: "Count" },
  PENDING: { label: "Pending", color: STATUS_COLORS.PENDING },
  APPROVED: { label: "Approved", color: STATUS_COLORS.APPROVED },
  REJECTED: { label: "Rejected", color: STATUS_COLORS.REJECTED },
  CANCELLED: { label: "Cancelled", color: STATUS_COLORS.CANCELLED },
} satisfies ChartConfig;

export function StatusDistributionChart({ data, totalRequests }: StatusDistributionChartProps) {
  const { t } = useTranslation();
  const chartData = data.map((item) => ({
    ...item,
    fill: STATUS_COLORS[item.status] ?? "hsl(220, 9%, 46%)",
  }));

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
        <Pie data={chartData} dataKey="count" nameKey="status" innerRadius={60} strokeWidth={5}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={entry.fill} />
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
                      {t("dashboard.requests")}
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
