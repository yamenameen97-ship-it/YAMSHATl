import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import LiveStream from "./pages/LiveStream";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";
import PKBattle from "./pages/PKBattle";
import Messages from "./pages/Messages";
import { useAuth } from "./_core/hooks/useAuth";
import { Button } from "./components/ui/button";
import { Menu, Home as HomeIcon, Radio, Wallet as WalletIcon, Bell, User } from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "./const";

function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            YamChat
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <a href="/" className="flex items-center gap-1 hover:text-blue-600 transition">
            <HomeIcon className="w-5 h-5" />
            الرئيسية
          </a>
          <a href="/live" className="flex items-center gap-1 hover:text-blue-600 transition">
            <Radio className="w-5 h-5" />
            البث المباشر
          </a>
          <a href="/wallet" className="flex items-center gap-1 hover:text-blue-600 transition">
            <WalletIcon className="w-5 h-5" />
            المحفظة
          </a>
          <a href="/notifications" className="flex items-center gap-1 hover:text-blue-600 transition">
            <Bell className="w-5 h-5" />
          </a>
          <a href="/profile" className="flex items-center gap-1 hover:text-blue-600 transition">
            <User className="w-5 h-5" />
          </a>
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="text-sm font-medium hidden sm:inline">{user?.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
              >
                تسجيل خروج
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              تسجيل الدخول
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/live"} component={LiveStream} />
        <Route path={"/wallet"} component={Wallet} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/notifications"} component={Notifications} />
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/pk-battle"} component={PKBattle} />
        <Route path={"/messages"} component={Messages} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
