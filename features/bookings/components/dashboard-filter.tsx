// features/bookings/components/dashboard-filter.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { syncClinicBookingsAction } from "@/actions/booking.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CloudDownload } from "lucide-react";

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultDate = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(searchParams.get("start") || defaultDate);
  const [endDate, setEndDate] = useState(searchParams.get("end") || defaultDate);

  const handleSyncAndFilter = () => {
    setError(null);
    startTransition(async () => {
      const result = await syncClinicBookingsAction(startDate, endDate);
      if (result.success) {
        const params = new URLSearchParams(window.location.search);
        params.set("start", startDate);
        params.set("end", endDate);
        router.push(`?${params.toString()}`);
        router.refresh();
      } else {
        setError(result.error ?? "Erro ao sincronizar.");
      }
    });
  };

  return (
    <div className="flex flex-col w-full gap-1">
      <div className="flex flex-col xl:flex-row items-center gap-1.5 p-1 bg-slate-50/80 rounded-xl border border-slate-200/60 shadow-inner w-full">
        
        <div className="flex w-full xl:w-auto items-center gap-1">
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="flex-1 h-8 border-transparent bg-white shadow-sm focus:ring-2 focus:ring-primary/20 rounded-lg text-xs font-medium text-slate-600"
          />
          <span className="text-slate-400 text-xs font-medium px-1">a</span>
          <Input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="flex-1 h-8 border-transparent bg-white shadow-sm focus:ring-2 focus:ring-primary/20 rounded-lg text-xs font-medium text-slate-600"
          />
        </div>
        
        <Button 
          onClick={handleSyncAndFilter} 
          disabled={isPending}
          variant="secondary"
          className="w-full xl:w-auto h-8 rounded-lg px-3 bg-white hover:bg-slate-100 text-slate-700 shadow-sm border border-slate-200 transition-all text-xs font-semibold"
        >
          {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-primary" /> : <CloudDownload className="mr-1.5 h-3.5 w-3.5 text-primary" />}
          Sincronizar Clínica
        </Button>
      </div>
      
      {error && <span className="text-[10px] text-rose-500 font-medium px-2">{error}</span>}
    </div>
  );
}