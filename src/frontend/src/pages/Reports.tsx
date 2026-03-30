import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import KPICard from "../components/KPICard";
import { useMenu, useOrders, useSalesReport } from "../hooks/useQueries";

type Period = "today" | "week" | "month";

const CATEGORY_LABELS: Record<string, string> = {
  espresso: "Espresso",
  latte: "Latte",
  coldBrew: "Cold Brew",
  pastries: "Pastries",
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("today");

  const { startTime, endTime } = useMemo(() => {
    const now = BigInt(Date.now()) * BigInt(1_000_000);
    let start: bigint;
    if (period === "today") {
      start = BigInt(new Date().setHours(0, 0, 0, 0)) * BigInt(1_000_000);
    } else if (period === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = BigInt(d.getTime()) * BigInt(1_000_000);
    } else {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = BigInt(d.getTime()) * BigInt(1_000_000);
    }
    return { startTime: start, endTime: now };
  }, [period]);

  const { data: report } = useSalesReport(startTime, endTime);
  const { data: orders = [] } = useOrders();
  const { data: menu = [] } = useMenu();

  const hourlyData = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const hourMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourMap[h] = 0;
    const paid = orders.filter(
      (o) =>
        o.status === "paid" && Number(o.timestamp) / 1_000_000 >= todayStart,
    );
    for (const o of paid) {
      const h = new Date(Number(o.timestamp) / 1_000_000).getHours();
      hourMap[h] = (hourMap[h] || 0) + Number(o.total);
    }
    return Object.entries(hourMap)
      .filter(([h]) => Number.parseInt(h) >= 6 && Number.parseInt(h) <= 22)
      .map(([h, v]) => ({ hour: `${h.padStart(2, "0")}:00`, value: v / 100 }));
  }, [orders]);

  const maxHourlyValue = Math.max(...hourlyData.map((d) => d.value), 1);

  const topItems = useMemo(() => {
    if (!report?.topSellingItems) return [];
    return report.topSellingItems
      .map(([itemId, qty]) => {
        const entry = menu.find(([id]) => id === itemId);
        return {
          name: entry?.[1]?.name ?? `Item #${itemId}`,
          qty: Number(qty),
        };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [report, menu]);

  const catRevenue = useMemo(() => {
    const cats: Record<string, number> = {
      espresso: 0,
      latte: 0,
      coldBrew: 0,
      pastries: 0,
    };
    const paidOrders = orders.filter((o) => o.status === "paid");
    for (const order of paidOrders) {
      for (const iq of order.items) {
        const entry = menu.find(([id]) => id === iq.itemId);
        if (entry) {
          const cat = entry[1].category;
          cats[cat] =
            (cats[cat] || 0) + Number(entry[1].price) * Number(iq.quantity);
        }
      }
    }
    return cats;
  }, [orders, menu]);

  const totalCatRevenue =
    Object.values(catRevenue).reduce((s, v) => s + v, 0) || 1;

  const PERIODS: { id: Period; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "Last 7 Days" },
    { id: "month", label: "Last 30 Days" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Revenue and performance analytics
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.id}
              data-ocid={`reports.${p.id}.button`}
              size="sm"
              variant={period === p.id ? "default" : "outline"}
              className={
                period === p.id
                  ? "bg-primary text-primary-foreground"
                  : "border-border"
              }
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={`$${(Number(report?.dailyRevenue ?? 0) / 100).toFixed(2)}`}
          icon={DollarSign}
          color="gold"
        />
        <KPICard
          title="Orders"
          value={report?.orderCount.toString() ?? "0"}
          icon={ShoppingBag}
          color="brown"
        />
        <KPICard
          title="Avg Order"
          value={`$${(Number(report?.averageOrderValue ?? 0) / 100).toFixed(2)}`}
          icon={TrendingUp}
          color="green"
        />
        <KPICard
          title="Top Item"
          value={topItems[0]?.name ?? "—"}
          subtitle={topItems[0] ? `${topItems[0].qty} sold` : "No data"}
          icon={BarChart3}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-accent" />
              Hourly Revenue (Today)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-end gap-1 h-36">
              {hourlyData.map((d) => (
                <div
                  key={d.hour}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    data-ocid="reports.chart_point"
                    className="w-full bg-accent/70 rounded-t hover:bg-accent transition-colors"
                    style={{
                      height: `${Math.max(4, (d.value / maxHourlyValue) * 120)}px`,
                    }}
                    title={`${d.hour}: $${d.value.toFixed(2)}`}
                  />
                  {Number.parseInt(d.hour) % 4 === 0 && (
                    <span className="text-[9px] text-muted-foreground">
                      {d.hour.slice(0, 2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground text-center">
              Hover bars for details
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-accent" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {topItems.length === 0 ? (
              <div
                data-ocid="reports.empty_state"
                className="text-center py-6 text-muted-foreground text-sm"
              >
                No sales data available
              </div>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={item.name} data-ocid={`reports.item.${i + 1}`}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">
                        {item.qty} sold
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{
                          width: `${(item.qty / (topItems[0]?.qty || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4 text-accent" />
            Revenue by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(catRevenue).map(([cat, rev]) => (
              <div
                key={cat}
                data-ocid={`reports.${cat}.card`}
                className="bg-secondary rounded-xl p-4"
              >
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {CATEGORY_LABELS[cat]}
                </p>
                <p className="text-xl font-bold text-foreground">
                  ${(rev / 100).toFixed(2)}
                </p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(rev / totalCatRevenue) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((rev / totalCatRevenue) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
