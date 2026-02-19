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
        setFeedback({ type: "success", message: `${result.count} mensagens enviadas para processamento.` });
        
        // Limpa a mensagem de sucesso após 5 segundos
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ type: "error", message: result.error ?? "Erro ao disparar." });
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button 
        onClick={handleTrigger} 
        disabled={isPending || pendingCount === 0}
        variant={pendingCount > 0 ? "default" : "secondary"}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Disparar ({pendingCount})
      </Button>
      
      {feedback && (
        <span className={`text-xs font-medium ${feedback.type === "success" ? "text-green-600" : "text-destructive"}`}>
          {feedback.message}
        </span>
      )}
    </div>
  );
}