import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Coffee,
  CreditCard,
  DollarSign,
  Plus,
  Search,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import type { OrderType } from "../backend.d";
import BillModal from "../components/BillModal";
import KPICard from "../components/KPICard";
import OrderCard from "../components/OrderCard";
import { useMenu, useOrders, useSalesReport } from "../hooks/useQueries";

const CATEGORY_IMAGES: Record<string, string> = {
  espresso: "/assets/generated/menu-espresso.dim_400x300.jpg",
  latte: "/assets/generated/menu-latte.dim_400x300.jpg",
  coldBrew: "/assets/generated/menu-coldbrew.dim_400x300.jpg",
  pastries: "/assets/generated/menu-pastries.dim_400x300.jpg",
};

const CATEGORY_LABELS: Record<string, string> = {
  espresso: "Espresso",
  latte: "Latte",
  coldBrew: "Cold Brew",
  pastries: "Pastries",
};

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [search, setSearch] = useState("");
  const [billOrderId, setBillOrderId] = useState<bigint | null>(null);
  const [billOrder, setBillOrder] = useState<OrderType | null>(null);

  const now = BigInt(Date.now()) * BigInt(1_000_000);
  const startOfDay =
    BigInt(new Date().setHours(0, 0, 0, 0)) * BigInt(1_000_000);
  const { data: orders = [] } = useOrders();
  const { data: report } = useSalesReport(startOfDay, now);
  const { data: menu = [] } = useMenu();

  const activeOrders = orders.filter(
    (o) => o.status !== "paid" && o.status !== "cancelled",
  );
  const filteredOrders = search
    ? activeOrders.filter(
        (o) =>
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.orderId.toString().includes(search),
      )
    : activeOrders;

  const categories = ["espresso", "latte", "coldBrew", "pastries"];
  const activeTables = new Set(
    activeOrders.map((o) => o.tableNumber.toString()),
  ).size;

  const handleBill = (orderId: bigint) => {
    const order = orders.find((o) => o.orderId === orderId) ?? null;
    setBillOrder(order);
    setBillOrderId(orderId);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Row 1: Heading + Search */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Overview
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            Good morning! ☕
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening at your café today.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="dashboard.search_input"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-60 bg-card border-border"
          />
        </div>
      </div>

      {/* Row 2: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Sales"
          value={`$${(Number(report?.dailyRevenue ?? 0) / 100).toFixed(2)}`}
          subtitle="Total revenue today"
          icon={DollarSign}
          color="gold"
        />
        <KPICard
          title="Orders Today"
          value={report?.orderCount.toString() ?? "0"}
          subtitle="Completed orders"
          icon={ShoppingBag}
          color="brown"
        />
        <KPICard
          title="Avg Order Value"
          value={`$${(Number(report?.averageOrderValue ?? 0) / 100).toFixed(2)}`}
          subtitle="Per transaction"
          icon={TrendingUp}
          color="green"
        />
        <KPICard
          title="Active Tables"
          value={activeTables.toString()}
          subtitle="Currently occupied"
          icon={Coffee}
          color="blue"
        />
      </div>

      {/* Row 3: Menu categories + Active orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Menu categories */}
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Menu Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const count = menu.filter(
                  ([, item]) => item.category === cat,
                ).length;
                return (
                  <button
                    type="button"
                    key={cat}
                    data-ocid={`dashboard.${cat}.button`}
                    onClick={() => onNavigate("menu")}
                    className="group relative overflow-hidden rounded-xl h-24 flex flex-col justify-end p-3 text-left shadow-xs hover:shadow-card transition-shadow"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${CATEGORY_IMAGES[cat]})`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
                    <div className="relative z-10">
                      <p className="text-white font-semibold text-sm">
                        {CATEGORY_LABELS[cat]}
                      </p>
                      <p className="text-white/70 text-xs">{count} items</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active orders */}
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Active Orders
              </CardTitle>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                {filteredOrders.length} active
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="h-56">
              {filteredOrders.length === 0 ? (
                <div
                  data-ocid="orders.empty_state"
                  className="text-center py-8 text-muted-foreground"
                >
                  <Coffee className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active orders</p>
                </div>
              ) : (
                <div className="space-y-2 pr-2">
                  {filteredOrders.map((order, i) => (
                    <OrderCard
                      key={order.orderId.toString()}
                      order={order}
                      index={i + 1}
                      showActions
                      onBill={handleBill}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Featured items + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Featured menu items */}
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Popular Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-3">
              {menu.slice(0, 4).map(([id, item], i) => (
                <div
                  key={id.toString()}
                  data-ocid={`menu.item.${i + 1}`}
                  className="bg-secondary rounded-xl p-3 flex flex-col gap-2"
                >
                  <div
                    className="h-16 rounded-lg bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${CATEGORY_IMAGES[item.category] ?? ""})`,
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${(Number(item.price) / 100).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    data-ocid={`menu.add_button.${i + 1}`}
                    size="sm"
                    className="w-full h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => onNavigate("new-order")}
                  >
                    Add to Order
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <Button
              data-ocid="dashboard.new_order.primary_button"
              className="w-full h-14 text-base bg-primary text-primary-foreground hover:bg-primary/90 justify-start px-5 gap-3"
              onClick={() => onNavigate("new-order")}
            >
              <Plus className="w-5 h-5" />
              Create New Order
            </Button>
            <Button
              data-ocid="dashboard.payment.button"
              variant="outline"
              className="w-full h-14 text-base border-border justify-start px-5 gap-3 hover:bg-secondary"
              onClick={() => onNavigate("orders")}
            >
              <CreditCard className="w-5 h-5 text-accent" />
              Process Payment
            </Button>
            <Button
              data-ocid="dashboard.reports.button"
              variant="outline"
              className="w-full h-14 text-base border-border justify-start px-5 gap-3 hover:bg-secondary"
              onClick={() => onNavigate("reports")}
            >
              <BarChart3 className="w-5 h-5 text-accent" />
              View Sales Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {billOrderId !== null && billOrder && (
        <BillModal
          orderId={billOrderId}
          customerName={billOrder.customerName}
          tableNumber={billOrder.tableNumber}
          onClose={() => {
            setBillOrderId(null);
            setBillOrder(null);
          }}
        />
      )}
    </div>
  );
}
