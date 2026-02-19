// app/api/webhooks/status/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Contrato estrito para o que aceitamos do n8n
const webhookSchema = z.object({
  phone: z.string().min(10, "Telefone inválido"),
  status: z.enum(["CONFIRMED", "CANCELLED"]),
});

export async function POST(req: Request) {
  try {
    // 1. Camada de Segurança: Autenticação Server-to-Server
    // No Next.js 15, headers() é uma Promise e deve ser aguardada
    const headersList = await headers();
    const apiKey = headersList.get("x-api-key");
    const { N8N_WEBHOOK_SECRET } = process.env;

    if (!N8N_WEBHOOK_SECRET || apiKey !== N8N_WEBHOOK_SECRET) {
      console.warn("[SECURITY_ALERT] Tentativa de acesso não autorizado ao Webhook.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extração e Validação do Payload
    const body = await req.json();
    const parsed = webhookSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[WEBHOOK_VALIDATION_ERROR]", parsed.error.flatten());
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    const { phone, status } = parsed.data;

    // 3. Higienização de Dados (Resolução da Divergência de DDI)
    // O WhatsApp envia "55419...", mas salvamos do Clinic como "419..."
    let normalizedPhone = phone.replace(/\D/g, ""); // Remove qualquer não-número caso exista
    if (normalizedPhone.startsWith("55") && normalizedPhone.length >= 12) {
      normalizedPhone = normalizedPhone.substring(2); // Corta o "55" inicial
    }

    // 4. Transação no Banco de Dados
    // Atualizamos apenas os agendamentos que ainda estão PENDENTES para evitar 
    // que respostas tardias alterem estados manualmente modificados pela clínica.
    const updateResult = await prisma.booking.updateMany({
      where: {
        patientMobile: {
          contains: normalizedPhone, // Usamos contains para garantir o match mesmo se houver espaços/hifens salvos no DB
        },
        confirmationStatus: "PENDING",
      },
      data: {
        confirmationStatus: status,
      },
    });

    // 5. Revalidação de Cache Nativa
    // Se algum registro foi de fato alterado, mandamos o Next.js invalidar 
    // a página do dashboard para os atendentes verem a atualização na mesma hora.
    if (updateResult.count > 0) {
      revalidatePath("/dashboard");
      console.log(`[WEBHOOK_SUCCESS] ${updateResult.count} agendamento(s) atualizado(s) para ${status} (Tel: ${normalizedPhone})`);
    } else {
      console.log(`[WEBHOOK_NO_MATCH] Nenhum agendamento pendente encontrado para o telefone ${normalizedPhone}`);
    }

    // 6. Resposta rápida para liberar a thread do n8n
    return NextResponse.json({
      success: true,
      updated: updateResult.count,
    });

  } catch (error) {
    console.error("[WEBHOOK_CRITICAL_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}