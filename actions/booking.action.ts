// actions/booking.action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { cancelClinicBooking, fetchClinicBookings } from "@/services/clinic.service";
import { revalidatePath } from "next/cache";

export async function syncClinicBookingsAction(startDate: string, endDate: string) {
  try {
    // 1. Busca da API Legada
    const externalBookings = await fetchClinicBookings(startDate, endDate);

    // 2. Sincroniza com nosso banco (Upsert em lote)
    const upsertPromises = externalBookings.map((booking) =>
      prisma.booking.upsert({
        where: { externalId: booking.id },
        update: {
          status: booking.status,
        },
        create: {
          externalId: booking.id,
          patientName: booking.client,
          patientMobile: booking.mobile,
          doctorName: booking.doctor,
          dateSchedule: booking.date_schedule, // A API clinic envia dd/MM/yyyy
          hourSchedule: booking.hour_schedule,
          status: booking.status,
        },
      })
    );

    await Promise.all(upsertPromises);

    // Limpa o cache da página de dashboard
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("[SYNC_ERROR]", error);
    return { success: false, error: "Falha ao sincronizar com o Clinic." };
  }
}

export async function updateBookingStatusAction(
  bookingId: string, 
  newStatus: "CONFIRMED" | "CANCELLED" | "PENDING"
) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    
    if (!booking) {
      return { success: false, error: "Agendamento não encontrado." };
    }

    // Regra de Negócio: Se o administrador mudar para CANCELADO manualmente, 
    // precisamos libertar a vaga na API legada da Clínica.
    if (newStatus === "CANCELLED" && booking.confirmationStatus !== "CANCELLED") {
      try {
        await cancelClinicBooking(booking.externalId);
      } catch (error) {
        console.error("[MANUAL_CANCEL_CLINIC_ERROR]", error);
        return { success: false, error: "Erro ao tentar cancelar a vaga no sistema da clínica." };
      }
    }

    // Atualiza o nosso banco local
    await prisma.booking.update({
      where: { id: bookingId },
      data: { confirmationStatus: newStatus }
    });

    // Revalida a interface
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/agendamentos");
    
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_STATUS_ERROR]", error);
    return { success: false, error: "Falha interna ao atualizar o status." };
  }
}