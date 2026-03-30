import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Coffee,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MenuItem } from "../backend.d";
import BillModal from "../components/BillModal";
import {
  useAddItemToOrder,
  useApplyDiscount,
  useCreateOrder,
  useMenu,
} from "../hooks/useQueries";

const CATEGORY_IMAGES: Record<string, string> = {
  espresso: "/assets/generated/menu-espresso.dim_400x300.jpg",
  latte: "/assets/generated/menu-latte.dim_400x300.jpg",
  coldBrew: "/assets/generated/menu-coldbrew.dim_400x300.jpg",
  pastries: "/assets/generated/menu-pastries.dim_400x300.jpg",
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  espresso: "Espresso",
  latte: "Latte",
  coldBrew: "Cold Brew",
  pastries: "Pastries",
};

interface CartItem {
  id: bigint;
  item: MenuItem;
  quantity: number;
}

export default function NewOrderPage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [billOrderId, setBillOrderId] = useState<bigint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: menu = [] } = useMenu();
  const createOrder = useCreateOrder();
  const addItemToOrder = useAddItemToOrder();
  const applyDiscount = useApplyDiscount();

  const filtered = menu.filter(([, item]) => {
    const matchCat = category === "all" || item.category === category;
    const matchSearch =
      !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && item.available;
  });

  const addToCart = (id: bigint, item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        return prev.map((c) =>
          c.id === id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { id, item, quantity: 1 }];
    });
  };

  const updateQty = (id: bigint, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );
  };

  const subtotal = cart.reduce(
    (sum, c) => sum + Number(c.item.price) * c.quantity,
    0,
  );
  const discountAmt = Math.round(subtotal * (Number(discount) / 100));
  const total = subtotal - discountAmt;

  const handleGenerateBill = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add items to the order");
      return;
    }
    const table = Number.parseInt(tableNumber);
    if (!table || table < 1) {
      toast.error("Valid table number required");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = await createOrder.mutateAsync({
        name: customerName,
        tableNumber: BigInt(table),
      });
      await Promise.all(
        cart.map((c) =>
          addItemToOrder.mutateAsync({
            orderId,
            itemId: c.id,
            quantity: BigInt(c.quantity),
          }),
        ),
      );
      if (Number(discount) > 0) {
        await applyDiscount.mutateAsync({
          orderId,
          discount: BigInt(Math.round(Number(discount))),
        });
      }
      toast.success("Order created!");
      setBillOrderId(orderId);
    } catch {
      toast.error("Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBillClose = () => {
    setBillOrderId(null);
    setCart([]);
    setCustomerName("");
    setDiscount("0");
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">New Order</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Select items and build the order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Left: Menu */}
        <div className="space-y-4">
          {/* Category + Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <Tabs value={category} onValueChange={setCategory}>
              <TabsList className="bg-card border border-border">
                {["all", "espresso", "latte", "coldBrew", "pastries"].map(
                  (cat) => (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      data-ocid={`order.${cat}.tab`}
                      className="text-xs"
                    >
                      {CATEGORY_LABELS[cat]}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </Tabs>
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-ocid="order.search_input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-9 bg-card border-border"
              />
            </div>
          </div>

          {/* Items grid */}
          {filtered.length === 0 ? (
            <div
              data-ocid="order.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Coffee className="w-10 h-10 mx-auto mb-2 opacity-25" />
              <p>No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(([id, item], i) => {
                const inCart = cart.find((c) => c.id === id);
                return (
                  <Card
                    key={id.toString()}
                    data-ocid={`order.item.${i + 1}`}
                    className="border-border shadow-xs hover:shadow-card transition-all cursor-pointer"
                    onClick={() => addToCart(id, item)}
                  >
                    <div
                      className="h-28 bg-cover bg-center rounded-t-lg relative"
                      style={{
                        backgroundImage: `url(${CATEGORY_IMAGES[item.category] ?? ""})`,
                      }}
                    >
                      {inCart && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">
                          {inCart.quantity}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-foreground">
                          ${(Number(item.price) / 100).toFixed(2)}
                        </span>
                        <Button
                          data-ocid={`order.add_button.${i + 1}`}
                          size="icon"
                          className="h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(id, item);
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <Card className="border-border shadow-card h-fit sticky top-20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="w-5 h-5 text-accent" />
              Cart
              {cart.length > 0 && (
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  {cart.reduce((s, c) => s + c.quantity, 0)} items
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Customer info */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="cust-name" className="text-xs">
                  Customer Name
                </Label>
                <Input
                  id="cust-name"
                  data-ocid="order.input"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8 text-sm bg-secondary border-border"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="table-no" className="text-xs">
                  Table #
                </Label>
                <Input
                  id="table-no"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="h-8 text-sm bg-secondary border-border"
                />
              </div>
            </div>

            <Separator />

            {/* Cart items */}
            {cart.length === 0 ? (
              <div
                data-ocid="cart.empty_state"
                className="text-center py-6 text-muted-foreground"
              >
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs">Click items to add them</p>
              </div>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-2 pr-1">
                  {cart.map((c, i) => (
                    <div
                      key={c.id.toString()}
                      data-ocid={`cart.item.${i + 1}`}
                      className="flex items-center gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {c.item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${(Number(c.item.price) / 100).toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          data-ocid={`cart.delete_button.${i + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => updateQty(c.id, -1)}
                        >
                          {c.quantity === 1 ? (
                            <Trash2 className="w-3 h-3 text-destructive" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                        </Button>
                        <span className="text-sm font-semibold w-5 text-center">
                          {c.quantity}
                        </span>
                        <Button
                          data-ocid={`cart.add_button.${i + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => updateQty(c.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold w-14 text-right">
                        $
                        {((Number(c.item.price) * c.quantity) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {cart.length > 0 && (
              <>
                <Separator />

                {/* Discount */}
                <div className="space-y-1">
                  <Label htmlFor="discount" className="text-xs">
                    Discount (%)
                  </Label>
                  <Input
                    id="discount"
                    data-ocid="cart.discount.input"
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-8 text-sm bg-secondary border-border"
                  />
                </div>

                {/* Totals */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%)</span>
                      <span>-${(discountAmt / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="brew-gold">
                      ${(total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  data-ocid="cart.submit_button"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11"
                  onClick={handleGenerateBill}
                  disabled={isSubmitting}
                >
                  <Receipt className="w-4 h-4" />
                  {isSubmitting ? "Creating..." : "Generate Bill"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {billOrderId !== null && (
        <BillModal
          orderId={billOrderId}
          customerName={customerName}
          tableNumber={BigInt(tableNumber || "1")}
          onClose={handleBillClose}
        />
      )}
    </div>
  );
}
