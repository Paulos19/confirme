// features/bookings/components/status-action-dropdown.tsx
"use client";

import { useTransition } from "react";
import { updateBookingStatusAction } from "@/actions/booking.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, XCircle, Clock, ChevronDown, Loader2 } from "lucide-react";

interface StatusActionDropdownProps {
  bookingId: string;
  currentStatus: string;
}

export function StatusActionDropdown({ bookingId, currentStatus }: StatusActionDropdownProps) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (newStatus: "CONFIRMED" | "CANCELLED" | "PENDING") => {
    if (newStatus === currentStatus) return; // Evita requisição atoa
    
    startTransition(async () => {
      const result = await updateBookingStatusAction(bookingId, newStatus);
      if (!result.success) {
        // Num cenário ideal, usaríamos toast() aqui da biblioteca Sonner
        alert(result.error); 
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Usamos Button ghost para manter a acessibilidade do clique correta */}
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent focus-visible:ring-offset-0 focus-visible:ring-0">
          <Badge 
            variant="outline"
            className={`
              px-3 py-1 text-xs font-bold border-0 shadow-sm cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95
              ${currentStatus === "CONFIRMED" ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-200" : ""}
              ${currentStatus === "CANCELLED" ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200 hover:bg-rose-200" : ""}
              ${currentStatus === "PENDING" ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-200" : ""}
            `}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {!isPending && currentStatus === "CONFIRMED" && "✓ CONFIRMADO"}
            {!isPending && currentStatus === "CANCELLED" && "✕ CANCELADO"}
            {!isPending && currentStatus === "PENDING" && "⌛ PENDENTE"}
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-lg border-slate-200">
        <DropdownMenuLabel className="text-xs text-slate-500 font-semibold px-2">
          Alteração Manual
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleUpdate("CONFIRMED")} 
          className="text-emerald-700 font-medium cursor-pointer focus:bg-emerald-50 focus:text-emerald-800 rounded-lg py-2.5"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Marcar como Confirmado
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleUpdate("PENDING")} 
          className="text-amber-700 font-medium cursor-pointer focus:bg-amber-50 focus:text-amber-800 rounded-lg py-2.5"
        >
          <Clock className="w-4 h-4 mr-2" />
          Retornar para Pendente
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleUpdate("CANCELLED")} 
          className="text-rose-700 font-bold cursor-pointer focus:bg-rose-50 focus:text-rose-800 rounded-lg py-2.5"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Cancelar Consulta (API)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}