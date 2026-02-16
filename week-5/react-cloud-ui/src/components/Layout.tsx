
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { LayoutDashboard, FileText, LogOut, Database } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/audit", label: "Audit Logs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col fixed h-full z-10 md:flex">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Database className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">Postgres Database</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t bg-muted/20">
          <div className="mb-4 px-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
              Signed in as
            </p>
            <p className="font-medium truncate text-sm">{user?.username}</p>
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