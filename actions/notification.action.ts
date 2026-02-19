// actions/notification.action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function triggerN8nConfirmationsAction(dateSchedule: string) {
  try {
    // 1. Busca estritamente os pendentes e não notificados para a data selecionada
    const pendingBookings = await prisma.booking.findMany({
      where: {
        dateSchedule: dateSchedule,
        confirmationStatus: "PENDING",
        n8nNotifiedAt: null, // Regra de Ouro: Idempotência
      },
      select: {
        id: true,
        patientName: true,
        patientMobile: true,
        dateSchedule: true,
        hourSchedule: true,
        doctorName: true,
      },
    });

    if (pendingBookings.length === 0) {
      return { success: false, error: "Nenhum agendamento pendente de notificação para esta data." };
    }

    // 2. Formata o payload exatamente como o n8n espera
    const payload = {
      bookings: pendingBookings.map((b) => ({
        id: b.id,
        patientName: b.patientName,
        patientMobile: b.patientMobile,
        date: b.dateSchedule,
        time: b.hourSchedule.substring(0, 5), // Envia apenas HH:mm
        doctor: b.doctorName,
      })),
    };

    const { N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET } = process.env;

    if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_SECRET) {
      throw new Error("[CONFIG_ERROR] Variáveis do n8n ausentes no ambiente.");
    }

    // 3. Dispara para o orquestrador (Assíncrono para o Next.js, síncrono para a requisição)
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": N8N_WEBHOOK_SECRET, // Proteção obrigatória
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Falha no n8n: ${response.statusText}`);
    }

    // 4. Marca os registros como notificados no nosso banco de dados
    const bookingIds = pendingBookings.map((b) => b.id);
    
    await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
      },
      data: {
        n8nNotifiedAt: new Date(),
      },
    });

    // 5. Invalida o cache para atualizar a UI
    revalidatePath("/dashboard");

    return { success: true, count: pendingBookings.length };
  } catch (error) {
    console.error("[N8N_TRIGGER_ERROR]", error);
    return { success: false, error: "Falha ao comunicar com o orquestrador de mensagens." };
  }
}