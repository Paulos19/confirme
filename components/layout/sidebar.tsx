// components/layout/sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Calendar, 
  LayoutDashboard, 
  Settings, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: "Painel Geral", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agendamentos", href: "/dashboard/agendamentos", icon: Calendar },
    { name: "Histórico e Logs", href: "/dashboard/logs", icon: Activity },
    { name: "Configurações", href: "/dashboard/config", icon: Settings },
  ];

  return (
    <aside 
      className={cn(
        "relative hidden h-screen flex-col border-r bg-white transition-all duration-300 ease-in-out md:flex",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-3 font-bold text-primary">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-md">
            <HeartPulse className="h-5 w-5" />
          </div>
          {!isCollapsed && <span className="text-lg tracking-tight">ClinicFlow</span>}
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-3 overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                isCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="border-t p-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
    </aside>
  );
}