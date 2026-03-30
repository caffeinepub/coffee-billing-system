import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "gold" | "brown" | "green" | "blue";
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  color = "gold",
}: KPICardProps) {
  const iconColors = {
    gold: "bg-accent/10 text-accent",
    brown: "bg-primary/10 text-primary",
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
  };

  return (
    <Card className="border-border shadow-card hover:shadow-card-hover transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${iconColors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                trendUp
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
