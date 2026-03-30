import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Coffee, LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Nav from "./components/Nav";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useInitMenu } from "./hooks/useQueries";
import Dashboard from "./pages/Dashboard";
import MenuPage from "./pages/Menu";
import NewOrderPage from "./pages/NewOrder";
import OrdersPage from "./pages/Orders";
import ReportsPage from "./pages/Reports";

export type Page =
  | "dashboard"
  | "menu"
  | "new-order"
  | "orders"
  | "reports"
  | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const { login, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { mutate: initMenuMutate } = useInitMenu();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (identity && !hasInitialized.current) {
      hasInitialized.current = true;
      initMenuMutate();
    }
  }, [identity, initMenuMutate]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center brew-header">
        <div className="flex flex-col items-center gap-4 text-white">
          <Coffee className="w-12 h-12 brew-gold animate-pulse" />
          <p className="text-lg font-semibold opacity-80">Loading BrewOps...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center brew-header">
        <div className="flex flex-col items-center gap-8 max-w-md text-center px-6">
          <div className="flex items-center gap-3">
            <Coffee className="w-12 h-12 brew-gold" />
            <span className="text-white text-4xl font-bold tracking-tight">
              BrewOps
            </span>
          </div>
          <p className="text-white/70 text-lg">
            Your premium coffee shop billing &amp; POS system
          </p>
          <div className="bg-white/10 rounded-2xl p-8 w-full backdrop-blur-sm border border-white/10">
            <h2 className="text-white text-xl font-semibold mb-2">
              Welcome Back
            </h2>
            <p className="text-white/60 text-sm mb-6">
              Sign in to access your dashboard
            </p>
            <Button
              data-ocid="login.primary_button"
              onClick={login}
              disabled={loginStatus === "logging-in"}
              className="w-full bg-accent hover:bg-accent/90 text-primary font-semibold h-12 text-base"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {loginStatus === "logging-in" ? "Signing in..." : "Sign In"}
            </Button>
          </div>
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} Built with love using{" "}
            <a
              href="https://caffeine.ai"
              className="underline hover:text-white/60"
              target="_blank"
              rel="noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard onNavigate={setPage} />;
      case "menu":
        return <MenuPage />;
      case "new-order":
        return <NewOrderPage />;
      case "orders":
        return <OrdersPage />;
      case "reports":
        return <ReportsPage />;
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Nav currentPage={page} onNavigate={setPage} />
      <main className="flex-1">{renderPage()}</main>
      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border bg-card">
        <span>
          &copy; {new Date().getFullYear()} BrewOps. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </span>
      </footer>
      <Toaster richColors position="top-right" />
    </div>
  );
}
