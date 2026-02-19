// actions/notification.action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function triggerN8nConfirmationsAction(dateSchedule: string) {
  try {
    // 1. Busca os pendentes
    const pendingBookings = await prisma.booking.findMany({
      where: {
        dateSchedule: dateSchedule,
        confirmationStatus: "PENDING",
        n8nNotifiedAt: null,
      }
    });

    if (pendingBookings.length === 0) {
      return { success: false, error: "Nenhum agendamento pendente de notificação." };
    }

    // 2. Busca o Template Salvo no Banco
    const config = await prisma.config.findUnique({ where: { id: "global" } });
    const template = config?.messageTemplate || "Você tem uma consulta dia {{date}} às {{time}}.";

    // Função auxiliar de Capitalize (ex: EDUARDO -> Eduardo)
    const toTitleCase = (str: string) => {
      return str.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
    };

    // 3. Monta o payload substituindo as variáveis AQUI NO NEXT.JS
    const payload = {
      bookings: pendingBookings.map((b) => {
        // Cálculo de datas
        const [dia, mes, ano] = b.dateSchedule.split('/');
        const dateObj = new Date(`${ano}-${mes}-${dia}T12:00:00`);
        const diasDaSemana = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
        
        const diaSemanaStr = diasDaSemana[dateObj.getDay()];
        const dataCurta = `${dia}/${mes}`;
        const patientNameFmt = toTitleCase(b.patientName);
        const doctorNameFmt = toTitleCase(b.doctorName);
        const timeFmt = b.hourSchedule.substring(0, 5);

        // Substituição das tags
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
          customMessage: finalMessage // Enviamos a mensagem 100% pronta!
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

    // 5. Marca como notificado no banco
    await prisma.booking.updateMany({
      where: { id: { in: pendingBookings.map(b => b.id) } },
      data: { n8nNotifiedAt: new Date() },
    });

    revalidatePath("/dashboard");
    return { success: true, count: pendingBookings.length };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao comunicar com orquestrador." };
  }
}