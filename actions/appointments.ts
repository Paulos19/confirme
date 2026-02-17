"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELED", "RESCHEDULED"]),
});

export async function updateAppointmentStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  const validation = UpdateStatusSchema.safeParse({ id, status });

  if (!validation.success) {
    return { error: "Dados inválidos" };
  }

  try {
    await prisma.appointment.update({
      where: { id },
      data: { status: validation.data.status },
    });

    // Atualiza a cache da página do dashboard instantaneamente
    revalidatePath("/dashboard");
    return { success: "Status atualizado com sucesso" };
  } catch (error) {
    return { error: "Erro ao atualizar status" };
  }
}