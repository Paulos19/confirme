import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateAppointmentStatusSchema } from "@/schemas/appointments";
import { z } from "zod";

export async function POST(req: Request) {
  // 1. Segurança
  const authHeader = req.headers.get("x-n8n-secret");
  if (authHeader !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized Access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phone, response } = UpdateAppointmentStatusSchema.parse(body);

    // Mapeamento de Intenção para Enum do Prisma
    const statusMap = {
      CONFIRM: "CONFIRMED",
      CANCEL: "CANCELED",
      RESCHEDULE: "RESCHEDULED" // O n8n pode tratar isso num fluxo separado depois
    } as const;

    const newStatus = statusMap[response];

    // 2. Busca Inteligente: O próximo agendamento PENDENTE a partir de AGORA
    const appointment = await prisma.appointment.findFirst({
      where: {
        patient: { phone },
        status: "PENDING",
        date: { gte: new Date() }, // Ignora agendamentos passados
      },
      orderBy: { date: "asc" }, // Pega o mais próximo
    });

    if (!appointment) {
      return NextResponse.json({ 
        success: false, 
        message: "Nenhum agendamento pendente encontrado para este número." 
      }, { status: 404 });
    }

    // 3. Atualização
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: newStatus },
      include: { patient: true } // Retorna dados para o n8n usar na mensagem de confirmação
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAppointment.id,
        newStatus: updatedAppointment.status,
        patientName: updatedAppointment.patient.name,
        patientPhone: updatedAppointment.patient.phone,
        date: updatedAppointment.date
      }
    });

  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}