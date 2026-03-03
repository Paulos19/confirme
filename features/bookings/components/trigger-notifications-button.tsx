// features/bookings/components/trigger-notifications-button.tsx
"use client";

import { useState, useTransition } from "react";
// Adicionamos a importação da nova action que você vai criar na próxima etapa
import { triggerN8nConfirmationsAction, retryN8nErrorsAction } from "@/actions/notification.action";
import { Button } from "@/components/ui/button";
import { Send, Loader2, RefreshCcw } from "lucide-react";
import { DispatchModal } from "./dispatch-modal";

type BookingMin = {
  id: string;
  patientName: string;
  confirmationStatus: string;
};

type TemplateMin = {
  id: string;
  name: string;
  isActive: boolean;
};

interface TriggerNotificationsButtonProps {
  date: string;
  bookings: BookingMin[];
  templates: TemplateMin[];
  pendingCount: number;
  confirmedCount: number;
  errorCount: number;
}

export function TriggerNotificationsButton({ date, bookings, templates, pendingCount, confirmedCount, errorCount }: TriggerNotificationsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleTrigger = () => {
    setIsModalOpen(true);
  };

  const handleRetryErrors = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await retryN8nErrorsAction(date);
      if (result.success) {
        setFeedback({ type: "success", message: `${result.count} reenviados.` });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ type: "error", message: result.error ?? "Erro ao reenviar." });
      }
    });
  };

  const elegibleCount = bookings.filter(b => b.confirmationStatus !== "CANCELLED").length;
  const hasItems = elegibleCount > 0;
  const hasErrors = errorCount > 0;

  return (
    <div className="flex flex-col items-center xl:items-end gap-1.5 relative w-full xl:w-auto">
      <div className="flex gap-2 w-full xl:w-auto">
        <Button
          onClick={handleTrigger}
          disabled={isPending || !hasItems}
          className={`flex-1 xl:w-auto h-9 rounded-xl px-4 transition-all duration-300 text-xs font-bold shadow-sm
            ${hasItems
              ? "bg-gradient-to-r from-primary to-primary/80 hover:shadow-md hover:shadow-primary/20 text-white"
              : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
            }
          `}
        >
          {isPending && !hasErrors ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className={`mr-1.5 h-3.5 w-3.5 ${hasItems ? "animate-bounce" : ""}`} />
          )}
          Disparar ({elegibleCount})
        </Button>

        {hasErrors && (
          <Button
            variant="outline"
            onClick={handleRetryErrors}
            disabled={isPending}
            className="flex-1 xl:w-auto h-9 rounded-xl px-4 transition-all duration-300 text-xs font-bold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-sm"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Reenviar Erros ({errorCount})
          </Button>
        )}
      </div>

      {feedback && (
        <div className={`xl:absolute xl:-bottom-6 right-0 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${feedback.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {feedback.message}
        </div>
      )}

      <DispatchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        date={date}
        bookings={bookings}
        templates={templates}
        pendingCount={pendingCount}
        confirmedCount={confirmedCount}
        onSuccess={(count) => {
          setFeedback({ type: "success", message: `${count} enviados.` });
          setTimeout(() => setFeedback(null), 5000);
        }}
        onError={(err) => {
          setFeedback({ type: "error", message: err });
        }}
      />
    </div>
  );
}