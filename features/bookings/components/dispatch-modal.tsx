"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { triggerN8nConfirmationsAction } from "@/actions/notification.action";

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

interface DispatchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    date: string;
    bookings: BookingMin[];
    templates: TemplateMin[];
    pendingCount: number;
    confirmedCount: number;
    onSuccess: (count: number) => void;
    onError: (error: string) => void;
}

type TargetMode = "ALL" | "CONFIRMED" | "PENDING" | "INDIVIDUAL";

export function DispatchModal({
    open,
    onOpenChange,
    date,
    bookings,
    templates,
    pendingCount,
    confirmedCount,
    onSuccess,
    onError,
}: DispatchModalProps) {
    const [isPending, startTransition] = useTransition();
    const [targetMode, setTargetMode] = useState<TargetMode>("ALL");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const defaultTemplateId = templates.find((t) => t.isActive)?.id || "";
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplateId);

    const elegibleBookings = bookings.filter((b) => b.confirmationStatus !== "CANCELLED");

    // Reset state when opening
    if (open && selectedTemplateId === "" && defaultTemplateId !== "") {
        setSelectedTemplateId(defaultTemplateId);
    }

    const handleTogglePatient = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const activeElegibleCount =
        targetMode === "ALL" ? elegibleBookings.length :
            targetMode === "PENDING" ? pendingCount :
                targetMode === "CONFIRMED" ? confirmedCount :
                    selectedIds.size;

    const handleSend = () => {
        if (activeElegibleCount === 0) return;

        startTransition(async () => {
            const result = await triggerN8nConfirmationsAction(date, {
                targetMode: targetMode,
                selectedIds: Array.from(selectedIds),
                templateId: selectedTemplateId || null,
            });

            if (result.success) {
                onSuccess(result.count || 0);
                onOpenChange(false);
            } else {
                onError(result.error ?? "Erro ao realizar disparo.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white p-6 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">Configurar Disparo</DialogTitle>
                    <DialogDescription>
                        Escolha o público-alvo e o template de mensagem que deseja usar para o envio.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 my-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-800">1. Público-alvo</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <label className={`flex items-center gap-2 border p-3 rounded-xl cursor-pointer transition-all ${targetMode === "ALL" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-slate-300"}`}>
                                <input type="radio" name="targetMode" value="ALL" checked={targetMode === "ALL"} onChange={() => setTargetMode("ALL")} className="text-primary focus:ring-primary w-4 h-4 accent-primary" />
                                <span className="text-xs font-semibold text-slate-700">Todos ({elegibleBookings.length})</span>
                            </label>

                            <label className={`flex items-center gap-2 border p-3 rounded-xl cursor-pointer transition-all ${targetMode === "PENDING" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-slate-300"}`}>
                                <input type="radio" name="targetMode" value="PENDING" checked={targetMode === "PENDING"} onChange={() => setTargetMode("PENDING")} className="text-primary focus:ring-primary w-4 h-4 accent-primary" />
                                <span className="text-xs font-semibold text-slate-700">Pendentes ({pendingCount})</span>
                            </label>

                            <label className={`flex items-center gap-2 border p-3 rounded-xl cursor-pointer transition-all ${targetMode === "CONFIRMED" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-slate-300"}`}>
                                <input type="radio" name="targetMode" value="CONFIRMED" checked={targetMode === "CONFIRMED"} onChange={() => setTargetMode("CONFIRMED")} className="text-primary focus:ring-primary w-4 h-4 accent-primary" />
                                <span className="text-xs font-semibold text-slate-700">Confirmados ({confirmedCount})</span>
                            </label>

                            <label className={`flex items-center gap-2 border p-3 rounded-xl cursor-pointer transition-all ${targetMode === "INDIVIDUAL" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-slate-300"}`}>
                                <input type="radio" name="targetMode" value="INDIVIDUAL" checked={targetMode === "INDIVIDUAL"} onChange={() => setTargetMode("INDIVIDUAL")} className="text-primary focus:ring-primary w-4 h-4 accent-primary" />
                                <span className="text-xs font-semibold text-slate-700">Individual</span>
                            </label>
                        </div>
                    </div>

                    {targetMode === "INDIVIDUAL" && (
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 overflow-y-auto max-h-[160px] space-y-2">
                            {elegibleBookings.length === 0 ? (
                                <div className="text-xs text-slate-400 text-center py-4">Nenhum paciente elegível.</div>
                            ) : (
                                elegibleBookings.map((b) => (
                                    <label key={b.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary"
                                            checked={selectedIds.has(b.id)}
                                            onChange={() => handleTogglePatient(b.id)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{b.patientName}</span>
                                            <span className="text-[10px] uppercase text-slate-400 font-semibold">{b.confirmationStatus}</span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-800">2. Template de Mensagem</h4>
                        <select
                            className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                        >
                            {templates.length === 0 ? (
                                <option value="">(Nenhum template cadastrado)</option>
                            ) : (
                                templates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} {t.isActive && "(Ativo Padrão)"}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                <DialogFooter className="mt-6 flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex-1 text-xs font-semibold text-slate-500 mr-auto w-full sm:w-auto">
                        Disparando para <span className="font-bold text-primary">{activeElegibleCount}</span> paciente(s).
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="w-full sm:w-auto font-bold h-10 rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isPending || activeElegibleCount === 0}
                        className="w-full sm:w-auto font-bold h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Confirmar Envio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
