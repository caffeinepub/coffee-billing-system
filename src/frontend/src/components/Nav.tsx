import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, Coffee, LogOut, User } from "lucide-react";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useOrders, useUserProfile } from "../hooks/useQueries";

const navItems: { id: Page; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "menu", label: "Menu" },
  { id: "new-order", label: "New Order" },
  { id: "orders", label: "All Orders" },
  { id: "reports", label: "Reports" },
];

interface NavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Nav({ currentPage, onNavigate }: NavProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const { data: orders } = useOrders();
  const pendingCount =
    orders?.filter((o) => o.status === "pending").length ?? 0;
  const displayName =
    profile?.name ||
    `${identity?.getPrincipal().toString().slice(0, 6)}...` ||
    "User";

  return (
    <header className="brew-header sticky top-0 z-50 shadow-lg">
      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center gap-6">
        {/* Brand */}
        <button
          type="button"
          data-ocid="nav.link"
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <Coffee className="w-7 h-7 text-accent" />
          <span className="text-white font-bold text-xl tracking-tight group-hover:text-accent transition-colors">
            BrewOps
          </span>
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-1 ml-4 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              data-ocid={`nav.${item.id}.link`}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.id
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            data-ocid="nav.notifications.button"
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            onClick={() => onNavigate("orders")}
          >
            <Bell className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-ocid="nav.user.button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-accent text-primary text-xs font-bold">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{displayName}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="gap-2"
                onClick={() => onNavigate("settings")}
              >
                <User className="w-4 h-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                data-ocid="nav.logout.button"
                className="gap-2 text-destructive"
                onClick={clear}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
