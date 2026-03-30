import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Coffee,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MenuItem, Type__1 } from "../backend.d";
import {
  useAddMenuItem,
  useDeleteMenuItem,
  useIsAdmin,
  useMenu,
  useUpdateMenuItem,
} from "../hooks/useQueries";

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
  all: "All",
};

const EMPTY_ITEM: MenuItem = {
  name: "",
  description: "",
  available: true,
  category: "espresso" as Type__1,
  price: BigInt(0),
};

const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h"];

export default function MenuPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<{
    id: bigint | null;
    item: MenuItem;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const { data: menu = [], isLoading } = useMenu();
  const { data: isAdmin } = useIsAdmin();
  const addItem = useAddMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const filtered = menu.filter(([, item]) => {
    const matchCat =
      categoryFilter === "all" || item.category === categoryFilter;
    const matchSearch =
      !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = async () => {
    if (!editItem) return;
    if (!editItem.item.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (Number(editItem.item.price) <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    try {
      if (editItem.id === null) {
        await addItem.mutateAsync(editItem.item);
        toast.success("Item added successfully");
      } else {
        await updateItem.mutateAsync({ id: editItem.id, item: editItem.item });
        toast.success("Item updated successfully");
      }
      setEditItem(null);
    } catch {
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteItem.mutateAsync(deleteId);
      toast.success("Item deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const handleToggleAvail = async (id: bigint, item: MenuItem) => {
    try {
      await updateItem.mutateAsync({
        id,
        item: { ...item, available: !item.available },
      });
      toast.success(`Item ${item.available ? "hidden" : "shown"}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Menu Management
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {menu.length} items across all categories
          </p>
        </div>
        {isAdmin && (
          <Button
            data-ocid="menu.open_modal_button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() =>
              setEditItem({
                id: null,
                item: { ...EMPTY_ITEM, price: BigInt(500) },
              })
            }
          >
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList className="bg-card border border-border">
            {["all", "espresso", "latte", "coldBrew", "pastries"].map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                data-ocid={`menu.${cat}.tab`}
                className="text-xs"
              >
                {CATEGORY_LABELS[cat]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="menu.search_input"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div
          data-ocid="menu.loading_state"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {SKELETON_KEYS.map((k) => (
            <div key={k} className="bg-card rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="menu.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Coffee className="w-12 h-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium">No items found</p>
          <p className="text-sm">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(([id, item], i) => (
            <Card
              key={id.toString()}
              data-ocid={`menu.item.${i + 1}`}
              className={`border-border shadow-xs hover:shadow-card transition-all ${
                !item.available ? "opacity-60" : ""
              }`}
            >
              <div
                className="h-36 bg-cover bg-center rounded-t-lg"
                style={{
                  backgroundImage: `url(${CATEGORY_IMAGES[item.category] ?? ""})`,
                }}
              />
              <CardContent className="p-3 space-y-2">
                <div>
                  <p className="font-semibold text-sm text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    ${(Number(item.price) / 100).toFixed(2)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.available ? "badge-paid" : "badge-cancelled"
                    }`}
                  >
                    {item.available ? "Available" : "Hidden"}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      data-ocid={`menu.toggle.${i + 1}`}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleToggleAvail(id, item)}
                    >
                      {item.available ? (
                        <ToggleRight className="w-4 h-4 text-accent" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      data-ocid={`menu.edit_button.${i + 1}`}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditItem({ id, item: { ...item } })}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      data-ocid={`menu.delete_button.${i + 1}`}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog
        open={editItem !== null}
        onOpenChange={(o) => !o && setEditItem(null)}
      >
        <DialogContent data-ocid="menu.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem?.id === null ? "Add New Item" : "Edit Item"}
            </DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  data-ocid="menu.input"
                  value={editItem.item.name}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      item: { ...editItem.item, name: e.target.value },
                    })
                  }
                  placeholder="e.g. Flat White"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-desc">Description</Label>
                <Textarea
                  id="item-desc"
                  data-ocid="menu.textarea"
                  value={editItem.item.description}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      item: { ...editItem.item, description: e.target.value },
                    })
                  }
                  placeholder="Short description..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={editItem.item.category}
                    onValueChange={(v) =>
                      setEditItem({
                        ...editItem,
                        item: { ...editItem.item, category: v as Type__1 },
                      })
                    }
                  >
                    <SelectTrigger data-ocid="menu.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="espresso">Espresso</SelectItem>
                      <SelectItem value="latte">Latte</SelectItem>
                      <SelectItem value="coldBrew">Cold Brew</SelectItem>
                      <SelectItem value="pastries">Pastries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="item-price">Price (cents)</Label>
                  <Input
                    id="item-price"
                    type="number"
                    min="0"
                    value={editItem.item.price.toString()}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        item: {
                          ...editItem.item,
                          price: BigInt(e.target.value || "0"),
                        },
                      })
                    }
                    placeholder="500"
                  />
                  <p className="text-xs text-muted-foreground">
                    ${(Number(editItem.item.price) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="menu.cancel_button"
              variant="outline"
              onClick={() => setEditItem(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="menu.save_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={addItem.isPending || updateItem.isPending}
            >
              {addItem.isPending || updateItem.isPending
                ? "Saving..."
                : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="menu.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="menu.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="menu.delete.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
