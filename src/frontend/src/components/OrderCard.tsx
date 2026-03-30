import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, MapPin } from "lucide-react";
import type { OrderType, Type } from "../backend.d";
import { useUpdateOrderStatus } from "../hooks/useQueries";

const statusLabel: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  cancelled: "Cancelled",
};

const statusClass: Record<string, string> = {
  pending: "badge-pending",
  processing: "badge-processing",
  paid: "badge-paid",
  cancelled: "badge-cancelled",
};

interface OrderCardProps {
  order: OrderType;
  index: number;
  showActions?: boolean;
  onBill?: (orderId: bigint) => void;
}

export default function OrderCard({
  order,
  index,
  showActions,
  onBill,
}: OrderCardProps) {
  const updateStatus = useUpdateOrderStatus();

  const formatTime = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nextStatus: Record<string, Type> = {
    pending: "processing" as Type,
    processing: "paid" as Type,
  };

  return (
    <Card
      data-ocid={`orders.item.${index}`}
      className="border-border shadow-xs hover:shadow-card transition-shadow"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground truncate">
                #{order.orderId.toString()}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass[order.status] || "badge-processing"}`}
              >
                {statusLabel[order.status] || order.status}
              </span>
            </div>
            <p className="text-sm text-foreground font-medium">
              {order.customerName}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Table{" "}
                {order.tableNumber.toString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatTime(order.timestamp)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {order.items.length} item(s)
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="text-base font-bold text-foreground">
              ${(Number(order.total) / 100).toFixed(2)}
            </p>
            {showActions && (
              <div className="flex items-center gap-1">
                {nextStatus[order.status] && (
                  <Button
                    data-ocid={`orders.edit_button.${index}`}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2"
                    onClick={() =>
                      updateStatus.mutate({
                        orderId: order.orderId,
                        status: nextStatus[order.status],
                      })
                    }
                  >
                    → {statusLabel[nextStatus[order.status]]}
                  </Button>
                )}
                {onBill && (
                  <Button
                    data-ocid={`orders.secondary_button.${index}`}
                    size="sm"
                    className="text-xs h-7 px-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => onBill(order.orderId)}
                  >
                    Bill
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
