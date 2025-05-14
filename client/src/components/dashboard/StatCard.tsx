import { Card, CardContent } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Package, 
  Bell,
  LucideIcon
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: "savings" | "products" | "alerts" | "drops";
}

export function StatCard({ title, value, subtitle, change, icon }: StatCardProps) {
  let IconComponent: LucideIcon;
  let iconBgColor: string;
  let iconColor: string;

  switch (icon) {
    case "savings":
      IconComponent = DollarSign;
      iconBgColor = "bg-green-100";
      iconColor = "text-green-600";
      break;
    case "products":
      IconComponent = Package;
      iconBgColor = "bg-blue-100";
      iconColor = "text-blue-600";
      break;
    case "alerts":
      IconComponent = Bell;
      iconBgColor = "bg-purple-100";
      iconColor = "text-purple-600";
      break;
    case "drops":
      IconComponent = TrendingDown;
      iconBgColor = "bg-amber-100";
      iconColor = "text-amber-600";
      break;
    default:
      IconComponent = Package;
      iconBgColor = "bg-blue-100";
      iconColor = "text-blue-600";
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <IconComponent className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        {(subtitle || change !== undefined) && (
          <div className="mt-2 flex items-center text-sm">
            {change !== undefined && (
              <>
                {change > 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4 text-green-600" />
                )}
                <span className={change > 0 ? "text-green-600" : "text-green-600"}>
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              </>
            )}
            {subtitle && (
              <span className="text-muted-foreground ml-1">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;
