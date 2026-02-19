// actions/booking.action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { fetchClinicBookings } from "@/services/clinic.service";
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