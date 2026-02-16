import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/auth-hooks/use-auth";
import { LayoutDashboard, FileText, LogOut, Database } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/audit", label: "Audit Logs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">
            PostStack
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                    ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="mb-4 px-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
              Signed in as
            </p>
            <p className="font-medium truncate text-sm text-foreground">
              {user?.username}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 animate-enter">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
