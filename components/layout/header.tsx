// components/layout/header.tsx
"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LogOut, 
  User, 
  Menu, 
  X, 
  LayoutDashboard, 
  Calendar, 
  Activity, 
  Settings,
  HeartPulse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Replicamos as rotas aqui para o Menu Mobile ser independente
const navItems = [
  { name: "Painel Geral", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: Calendar },
  { name: "Histórico e Logs", href: "/dashboard/logs", icon: Activity },
  { name: "Configurações", href: "/dashboard/config", icon: Settings },
];

export function Header({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fecha o menu mobile se a rota mudar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/70 backdrop-blur-xl px-4 sm:px-6 transition-all">
        
        {/* Lado Esquerdo: Botão Mobile & Logo (visível apenas em telas pequenas) */}
        <div className="flex items-center gap-3 md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 rounded-full"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir Menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight text-slate-900">ClinicFlow</h1>
          </div>
        </div>

        {/* Espaçador para empurrar o perfil para a direita em Desktop */}
        <div className="hidden md:flex flex-1" />
        
        {/* Lado Direito: Perfil do Usuário */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1.5 h-auto border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 ease-out focus-visible:ring-primary/20"
              >
                <div className="bg-gradient-to-tr from-primary/20 to-primary/10 p-1.5 rounded-full ring-1 ring-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden flex-col items-start sm:flex">
                  <span className="text-sm font-semibold text-slate-700 leading-none">Admin</span>
                  <span className="text-[10px] font-medium text-slate-400 mt-0.5 leading-none">Gestão</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-slate-100">
              <DropdownMenuLabel className="font-normal px-2 py-3">
                <div className="flex flex-col space-y-1.5">
                  <p className="text-sm font-bold text-slate-800">Conta Administrativa</p>
                  <p className="text-xs font-medium text-slate-500 truncate">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem 
                className="text-rose-600 cursor-pointer font-semibold rounded-xl mt-1 focus:bg-rose-50 focus:text-rose-700 transition-colors py-2.5" 
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Terminar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* OVERLAY DO MENU MOBILE */}
      {/* Fundo Escuro Blur */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer Lateral Mobile */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) md:hidden flex flex-col",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-primary">
            <HeartPulse className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight">ClinicFlow</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="rounded-full hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}