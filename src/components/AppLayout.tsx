import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Home, History, Scale, Utensils, TrendingUp, LogOut, User, ShieldAlert, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/history", icon: History, label: "History" },
  { to: "/weight", icon: Scale, label: "Weight" },
  { to: "/meals", icon: Utensils, label: "Meals" },
  { to: "/insights", icon: TrendingUp, label: "Insights" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (data?.role === 'admin') setIsAdmin(true);
    };
    checkAdmin();
  }, [user]);

  const allNavItems = isAdmin
    ? [...navItems, { to: "/admin", icon: ShieldAlert, label: "Admin" }]
    : navItems;

  return (
    <div className="flex min-h-screen flex-col bg-background safe-area-inset-top">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <Flame className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">FastFlow</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container flex-1 py-6 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-6">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex justify-around py-3">
          {allNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
              end={to === "/dashboard"}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop sidebar-style nav */}
      <nav className="fixed left-0 top-14 hidden h-[calc(100vh-3.5rem)] w-56 border-r bg-card/50 p-4 md:block">
        <div className="space-y-1">
          {allNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
