import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Coffee, Printer } from "lucide-react";
import { useGetBillSummary, useMenu } from "../hooks/useQueries";

interface BillModalProps {
  orderId: bigint | null;
  customerName: string;
  tableNumber: bigint;
  onClose: () => void;
}

export default function BillModal({
  orderId,
  customerName,
  tableNumber,
  onClose,
}: BillModalProps) {
  const { data: bill } = useGetBillSummary(orderId);
  const { data: menu } = useMenu();

  const getItemName = (itemId: bigint) => {
    const entry = menu?.find(([id]) => id === itemId);
    return entry?.[1]?.name ?? `Item #${itemId}`;
  };

  const getItemPrice = (itemId: bigint) => {
    const entry = menu?.find(([id]) => id === itemId);
    return Number(entry?.[1]?.price ?? 0);
  };

  const handlePrint = () => window.print();

  return (
    <Dialog open={orderId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-ocid="bill.dialog" className="max-w-sm border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-accent" />
            Bill Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="text-center py-3 bg-secondary rounded-lg">
            <p className="font-bold text-lg text-foreground">BrewOps Café</p>
            <p className="text-sm text-muted-foreground">
              Order #{orderId?.toString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Table {tableNumber.toString()} · {customerName}
            </p>
          </div>

          {/* Items */}
          {bill && (
            <div className="space-y-2">
              {bill.items.map((item) => (
                <div
                  key={item.itemId.toString()}
                  className="flex justify-between text-sm"
                >
                  <span className="text-foreground">
                    {getItemName(item.itemId)} × {item.quantity.toString()}
                  </span>
                  <span className="font-medium">
                    $
                    {(
                      (getItemPrice(item.itemId) * Number(item.quantity)) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {bill && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(Number(bill.subtotal) / 100).toFixed(2)}</span>
              </div>
              {Number(bill.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({bill.discount.toString()}%)</span>
                  <span>
                    -$
                    {(
                      (Number(bill.subtotal) - Number(bill.total)) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="brew-gold">
                  ${(Number(bill.total) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground pt-1">
            Thank you for visiting BrewOps! ☕
          </div>

          <div className="flex gap-2">
            <Button
              data-ocid="bill.close_button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              data-ocid="bill.primary_button"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
