// actions/notification.action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function triggerN8nConfirmationsAction(dateSchedule: string) {
  try {
    // 1. NOVA REGRA DE NEGÓCIO: Busca os alvos válidos.
    // Removemos o bloqueio "n8nNotifiedAt: null" para permitir múltiplos disparos.
    // Adicionamos a barreira Absoluta: NUNCA enviar para "CANCELLED".
    const targetBookings = await prisma.booking.findMany({
      where: {
        dateSchedule: dateSchedule,
        confirmationStatus: {
          not: "CANCELLED", // Regra de ouro aplicada
        }
      }
    });

    if (targetBookings.length === 0) {
      return { success: false, error: "Nenhum paciente elegível para notificação nesta data." };
    }

    // 2. Busca o Template Salvo no Banco
    const config = await prisma.config.findUnique({ where: { id: "global" } });
    const template = config?.messageTemplate || "Você tem uma consulta dia {{date}} às {{time}}.";

    const toTitleCase = (str: string) => {
      return str.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
    };

    // 3. Monta o payload substituindo as variáveis para os alvos válidos
    const payload = {
      bookings: targetBookings.map((b) => {
        const [dia, mes, ano] = b.dateSchedule.split('/');
        const dateObj = new Date(`${ano}-${mes}-${dia}T12:00:00`);
        const diasDaSemana = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
        
        const diaSemanaStr = diasDaSemana[dateObj.getDay()];
        const dataCurta = `${dia}/${mes}`;
        const patientNameFmt = toTitleCase(b.patientName);
        const doctorNameFmt = toTitleCase(b.doctorName);
        const timeFmt = b.hourSchedule.substring(0, 5);

        let finalMessage = template
          .replace(/{{patientName}}/g, patientNameFmt)
          .replace(/{{doctor}}/g, doctorNameFmt)
          .replace(/{{date}}/g, b.dateSchedule)
          .replace(/{{dataCurta}}/g, dataCurta)
          .replace(/{{diaSemana}}/g, diaSemanaStr)
          .replace(/{{time}}/g, timeFmt);

        return {
          id: b.id,
          patientMobile: b.patientMobile,
          customMessage: finalMessage 
        };
      }),
    };

    const { N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET } = process.env;

    // 4. Dispara para o n8n
    const response = await fetch(N8N_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": N8N_WEBHOOK_SECRET!,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Falha n8n");

    // 5. Atualiza a data da última notificação para todos os que receberam este disparo
    await prisma.booking.updateMany({
      where: { id: { in: targetBookings.map(b => b.id) } },
      data: { n8nNotifiedAt: new Date() },
    });

    revalidatePath("/dashboard");
    return { success: true, count: targetBookings.length };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao comunicar com orquestrador." };
  }
}