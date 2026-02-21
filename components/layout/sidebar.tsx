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
  HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  // Começamos o estado como false para mostrar a barra completa ao carregar
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
        "relative hidden h-screen flex-col border-r border-slate-200/60 bg-white transition-all duration-500 ease-in-out md:flex z-20 shadow-[4px_0_24px_rgba(0,0,0,0.01)]",
        isCollapsed ? "w-[80px]" : "w-64"
      )}
    >
      {/* Botão Flutuante de Retração (Estilo Notion/Linear) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-7 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 z-50 text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform duration-500 ease-in-out", isCollapsed && "rotate-180")} />
      </button>

      {/* Área da Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center px-4">
        <Link 
          href="/dashboard" 
          className={cn(
            "flex items-center gap-3 font-bold text-slate-900 transition-all duration-300 w-full",
            isCollapsed ? "justify-center" : "px-2"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 duration-300">
            <HeartPulse className="h-5 w-5" />
          </div>
          
          <div className={cn("flex flex-col overflow-hidden transition-all duration-500", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            <span className="text-[17px] tracking-tight whitespace-nowrap leading-none">ClinicFlow</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">Enterprise</span>
          </div>
        </Link>
      </div>
      
      {/* Navegação */}
      <nav className="flex-1 space-y-1.5 p-3 mt-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className="relative flex items-center group"
            >
              {/* Indicador de Rota Ativa (Barra Lateral Esquerda) */}
              <div 
                className={cn(
                  "absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full transition-all duration-300 ease-out", 
                  isActive ? "bg-primary" : "bg-transparent scale-y-0 group-hover:scale-y-100 group-hover:bg-slate-200"
                )} 
              />

              <div 
                className={cn(
                  "flex items-center rounded-xl w-full mx-2 py-2.5 transition-all duration-300",
                  isActive 
                    ? "bg-primary/5 text-primary font-semibold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium",
                  isCollapsed ? "justify-center px-0" : "px-3 gap-3"
                )}
              >
                <item.icon 
                  className={cn(
                    "h-[22px] w-[22px] shrink-0 transition-colors duration-300", 
                    isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                  )} 
                />
                
                <span 
                  className={cn(
                    "whitespace-nowrap transition-all duration-500",
                    isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
                  )}
                >
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer da Sidebar (opcional para exibir versão ou ajuda futuramente) */}
      <div className={cn("p-4 transition-opacity duration-300", isCollapsed ? "opacity-0" : "opacity-100")}>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistema Ativo</span>
          <span className="text-xs text-slate-500 mt-0.5">v2.0.1 (Stable)</span>
        </div>
      </div>
    </aside>
  );
}