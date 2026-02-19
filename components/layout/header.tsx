// components/layout/header.tsx
"use client";

import { signOut } from "next-auth/react"; // Ajuste conforme seu auth.js (v5 usa next-auth/react no client)
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 sm:h-16 sm:px-6">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-xl font-semibold tracking-tight lg:hidden">
          ClinicFlow
        </h1>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        {/* Espaço para adicionar um seletor de Tema (Dark/Light) futuramente */}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Menu do usuário</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Administrador</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer" 
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair do Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}