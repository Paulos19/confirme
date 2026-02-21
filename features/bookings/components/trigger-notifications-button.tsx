// features/bookings/components/trigger-notifications-button.tsx
"use client";

import { useState, useTransition } from "react";
import { triggerN8nConfirmationsAction } from "@/actions/notification.action";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface TriggerNotificationsButtonProps {
  date: string;
  pendingCount: number;
}

export function TriggerNotificationsButton({ date, pendingCount }: TriggerNotificationsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleTrigger = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await triggerN8nConfirmationsAction(date);
      if (result.success) {
        setFeedback({ type: "success", message: `${result.count} enviados.` });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ type: "error", message: result.error ?? "Erro ao disparar." });
      }
    });
  };

  const hasItems = pendingCount > 0;

  return (
    <div className="flex flex-col items-center xl:items-end gap-1.5 relative w-full xl:w-auto">
      <Button 
        onClick={handleTrigger} 
        disabled={isPending || !hasItems}
        className={`w-full xl:w-auto h-9 rounded-xl px-4 transition-all duration-300 text-xs font-bold shadow-sm
          ${hasItems 
            ? "bg-gradient-to-r from-primary to-primary/80 hover:shadow-md hover:shadow-primary/20 text-white" 
            : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
          }
        `}
      >
        {isPending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className={`mr-1.5 h-3.5 w-3.5 ${hasItems ? "animate-bounce" : ""}`} />
        )}
        Disparar ({pendingCount})
      </Button>
      
      {feedback && (
        <div className={`xl:absolute xl:-bottom-6 right-0 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${feedback.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}