// features/bookings/components/dashboard-filter.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { syncClinicBookingsAction } from "@/actions/booking.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Default para hoje caso não tenha params na URL. 
  // O input type="date" sempre trabalha com YYYY-MM-DD
  const defaultDate = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(searchParams.get("start") || defaultDate);
  const [endDate, setEndDate] = useState(searchParams.get("end") || defaultDate);

  const handleSyncAndFilter = () => {
    setError(null);
    startTransition(async () => {
      // 1. Chama a Action enviando no formato YYYY-MM-DD (que a API do Clinic espera na URL)
      const result = await syncClinicBookingsAction(startDate, endDate);
      
      if (result.success) {
        // 2. Atualiza a URL do navegador
        const params = new URLSearchParams(window.location.search);
        params.set("start", startDate);
        params.set("end", endDate);
        
        // 3. O router.push faz o Next.js re-renderizar o Server Component (page.tsx)
        router.push(`?${params.toString()}`);
        router.refresh();
      } else {
        // CORREÇÃO: Fallback garantindo que nunca passaremos undefined para o estado
        setError(result.error ?? "Erro desconhecido ao sincronizar.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Data Inicial</label>
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="w-auto"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Data Final</label>
          <Input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="w-auto"
          />
        </div>
        <Button onClick={handleSyncAndFilter} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Buscar e Sincronizar
        </Button>
      </div>
      {error && <span className="text-sm text-destructive font-medium">{error}</span>}
    </div>
  );
}