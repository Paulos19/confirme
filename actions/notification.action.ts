// actions/notification.action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function triggerN8nConfirmationsAction(dateSchedule: string) {
  try {
    // 1. REGRA DE NEGÓCIO: Busca os alvos válidos.
    // Permite múltiplos disparos (n8nNotifiedAt não é restritivo).
    // Barreira Absoluta: NUNCA enviar para "CANCELLED".
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

    // 2. Busca o Template ATIVO no Banco (NOVA ESTRUTURA DE TEMPLATES)
    const activeTemplate = await prisma.messageTemplate.findFirst({ 
      where: { isActive: true } 
    });
    
    // Fallback de segurança caso o admin tenha apagado tudo ou não ativado nenhum
    const templateContent = activeTemplate?.content || "Você tem uma consulta dia {{date}} às {{time}}.";

    // Função auxiliar para capitalizar nomes (ex: JOAO -> Joao)
    const toTitleCase = (str: string) => {
      return str.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
    };

    // 3. Monta o payload substituindo as variáveis dinâmicas do template ativo
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

        // Aplica o template dinâmico processado pelo servidor
        let finalMessage = templateContent
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