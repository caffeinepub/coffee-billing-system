import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coffee, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { OrderType, Type } from "../backend.d";
import BillModal from "../components/BillModal";
import { useOrders, useUpdateOrderStatus } from "../hooks/useQueries";

const STATUS_TABS = ["all", "pending", "processing", "paid", "cancelled"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  cancelled: "Cancelled",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "badge-pending",
  processing: "badge-processing",
  paid: "badge-paid",
  cancelled: "badge-cancelled",
};

export default function OrdersPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [billOrderId, setBillOrderId] = useState<bigint | null>(null);
  const [billOrder, setBillOrder] = useState<OrderType | null>(null);

  const { data: orders = [], isLoading, refetch } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  const filtered = orders.filter((o) => {
    const matchTab = tab === "all" || o.status === tab;
    const matchSearch =
      !search ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderId.toString().includes(search) ||
      o.tableNumber.toString().includes(search);
    return matchTab && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  const formatTime = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusChange = async (orderId: bigint, status: Type) => {
    try {
      await updateStatus.mutateAsync({ orderId, status });
      toast.success(`Order updated to ${STATUS_LABELS[status]}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleBill = (order: OrderType) => {
    setBillOrder(order);
    setBillOrderId(order.orderId);
  };

  const counts = STATUS_TABS.reduce(
    (acc, s) => {
      acc[s] =
        s === "all"
          ? orders.length
          : orders.filter((o) => o.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {orders.length} total orders
          </p>
        </div>
        <Button
          data-ocid="orders.refresh.button"
          variant="outline"
          className="gap-2 border-border"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-card border border-border">
            {STATUS_TABS.map((s) => (
              <TabsTrigger
                key={s}
                value={s}
                data-ocid={`orders.${s}.tab`}
                className="text-xs gap-1.5"
              >
                {s === "all" ? "All" : STATUS_LABELS[s]}
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                  {counts[s]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="orders.search_input"
            placeholder="Search by name, order #, or table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-border shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div
              data-ocid="orders.loading_state"
              className="p-12 text-center text-muted-foreground"
            >
              <Coffee className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
              <p>Loading orders...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div
              data-ocid="orders.empty_state"
              className="p-12 text-center text-muted-foreground"
            >
              <Coffee className="w-8 h-8 mx-auto mb-3 opacity-25" />
              <p className="font-medium">No orders found</p>
              <p className="text-sm">Try a different filter</p>
            </div>
          ) : (
            <Table data-ocid="orders.table">
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-20">Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-20">Table</TableHead>
                  <TableHead className="w-24">Items</TableHead>
                  <TableHead className="w-28">Total</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="w-40">Time</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((order, i) => (
                  <TableRow
                    key={order.orderId.toString()}
                    data-ocid={`orders.row.${i + 1}`}
                    className="border-border hover:bg-secondary/40"
                  >
                    <TableCell className="font-mono text-sm font-semibold text-muted-foreground">
                      #{order.orderId.toString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      Table {order.tableNumber.toString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.items.length} item(s)
                    </TableCell>
                    <TableCell className="font-bold">
                      ${(Number(order.total) / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(v) =>
                          handleStatusChange(order.orderId, v as Type)
                        }
                      >
                        <SelectTrigger
                          data-ocid={`orders.status.select.${i + 1}`}
                          className={`h-7 text-xs w-28 font-medium ${STATUS_CLASS[order.status] || ""} border-0`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTime(order.timestamp)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        data-ocid={`orders.secondary_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleBill(order)}
                      >
                        View Bill
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
