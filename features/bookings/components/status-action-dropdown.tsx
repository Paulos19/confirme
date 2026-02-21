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
    if (newStatus === currentStatus) return; 
    startTransition(async () => {
      const result = await updateBookingStatusAction(bookingId, newStatus);
      if (!result.success) alert(result.error); 
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md">
          <Badge 
            variant="outline"
            className={`
              px-2.5 py-1 text-[10px] font-bold border border-transparent shadow-sm cursor-pointer flex items-center gap-1.5 transition-all duration-300 hover:scale-105 active:scale-95 uppercase tracking-wider
              ${currentStatus === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : ""}
              ${currentStatus === "CANCELLED" ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : ""}
              ${currentStatus === "PENDING" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : ""}
            `}
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {!isPending && currentStatus === "CONFIRMED" && <><CheckCircle2 className="w-3 h-3" /> CONFIRMADO</>}
            {!isPending && currentStatus === "CANCELLED" && <><XCircle className="w-3 h-3" /> CANCELADO</>}
            {!isPending && currentStatus === "PENDING" && <><Clock className="w-3 h-3" /> PENDENTE</>}
            <ChevronDown className="w-3 h-3 opacity-40" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-lg border-slate-100/80 bg-white/95 backdrop-blur-md animate-in fade-in-80 zoom-in-95">
        <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1">
          Modificar Estado
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100 my-1" />
        
        <div className="space-y-0.5">
          <DropdownMenuItem onClick={() => handleUpdate("CONFIRMED")} className="text-emerald-700 text-xs font-semibold cursor-pointer focus:bg-emerald-50 rounded-lg py-2">
            <CheckCircle2 className="w-3.5 h-3.5 mr-2.5" />
            Marcar Confirmado
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleUpdate("PENDING")} className="text-amber-700 text-xs font-semibold cursor-pointer focus:bg-amber-50 rounded-lg py-2">
            <Clock className="w-3.5 h-3.5 mr-2.5" />
            Mover a Pendente
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-100 my-1" />
          <DropdownMenuItem onClick={() => handleUpdate("CANCELLED")} className="text-rose-600 text-xs font-bold cursor-pointer focus:bg-rose-50 rounded-lg py-2">
            <XCircle className="w-3.5 h-3.5 mr-2.5" />
            Cancelar e Libertar
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}