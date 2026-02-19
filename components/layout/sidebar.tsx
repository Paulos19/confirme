// components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutDashboard, Settings, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agendamentos", href: "/dashboard/agendamentos", icon: Calendar },
    { name: "Logs de Automação", href: "/dashboard/logs", icon: Activity },
    { name: "Configurações", href: "/dashboard/config", icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-14 flex-col border-r bg-background lg:flex lg:w-64 transition-all">
      <div className="flex h-14 items-center border-b px-4 lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
            <Calendar className="h-4 w-4" />
          </div>
          <span className="hidden lg:block">ClinicFlow</span>
        </Link>
      </div>
      
      <nav className="flex flex-col gap-1 px-2 py-4 lg:px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden lg:block">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}