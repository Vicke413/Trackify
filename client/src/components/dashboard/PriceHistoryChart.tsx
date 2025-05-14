import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceHistory } from "@shared/schema";

interface PriceHistoryChartProps {
  data: PriceHistory[];
  currency: string;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  currency: string;
}

const CustomTooltip = ({ active, payload, label, currency }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border shadow-sm rounded-md p-2 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{formatCurrency(payload[0].value as number, currency)}</p>
      </div>
    );
  }

  return null;
};

export function PriceHistoryChart({ data, currency }: PriceHistoryChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: new Date(item.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: Number(item.price),
    }));
  }, [data]);

  const minPrice = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.min(...data.map((item) => Number(item.price))) * 0.95;
  }, [data]);

  const maxPrice = useMemo(() => {
    if (data.length === 0) return 100;
    return Math.max(...data.map((item) => Number(item.price))) * 1.05;
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Price History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  domain={[minPrice, maxPrice]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value, currency)}
                  tickMargin={10}
                  width={80}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center flex-col">
              <p className="text-muted-foreground">No price history available yet</p>
              <p className="text-sm text-muted-foreground">
                Price history will appear once there's more data
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PriceHistoryChart;
