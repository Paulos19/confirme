// features/bookings/components/local-date-filter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function LocalDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentDate = searchParams.get("start") || format(new Date(), "yyyy-MM-dd");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const params = new URLSearchParams(window.location.search);
    params.set("start", newDate);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative group flex items-center w-full xl:w-[160px]">
      <div className="absolute left-3 text-slate-400 group-focus-within:text-primary transition-colors">
        <CalendarIcon className="h-3.5 w-3.5" />
      </div>
      <Input 
        id="date-filter"
        type="date" 
        value={currentDate} 
        onChange={handleDateChange} 
        className="pl-9 h-9 w-full rounded-xl bg-slate-50/80 border-slate-200/60 text-sm font-medium text-slate-700 shadow-sm transition-all focus:bg-white focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
      />
    </div>
  );
}