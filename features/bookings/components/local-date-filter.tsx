// features/bookings/components/local-date-filter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LocalDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Se não houver data na URL, assume o dia de hoje
  const currentDate = searchParams.get("start") || format(new Date(), "yyyy-MM-dd");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const params = new URLSearchParams(window.location.search);
    params.set("start", newDate);
    // Atualiza a rota, forçando o Server Component a re-renderizar com a nova data local
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="date-filter" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
        Ver Agenda Local
      </Label>
      <Input 
        id="date-filter"
        type="date" 
        value={currentDate} 
        onChange={handleDateChange} 
        className="w-[150px] bg-background"
      />
    </div>
  );
}