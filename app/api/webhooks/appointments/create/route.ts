import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateAppointmentSchema } from "@/schemas/appointments";
import { z } from "zod";

export async function POST(req: Request) {
  // 1. Camada de Segurança (Middleware manual para rotas de API)
  const authHeader = req.headers.get("x-n8n-secret");
  if (authHeader !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized Access" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 2. Validação Estrita
    const { name, phone, date, notes } = CreateAppointmentSchema.parse(body);

    // 3. Execução Atômica (Transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Upsert: Garante que o paciente existe e está atualizado
      const patient = await tx.patient.upsert({
        where: { phone },
        update: { name }, // Atualiza nome se o parser pegou um nome mais completo
        create: { name, phone },
      });

      // Verifica se já existe agendamento neste horário exato (Conflito)
      const existingAppointment = await tx.appointment.findFirst({
        where: { date: new Date(date) }
      });

      if (existingAppointment) {
        throw new Error("SLOT_BUSY");
      }

      const appointment = await tx.appointment.create({
        data: {
          date: new Date(date),
          patientId: patient.id,
          status: "PENDING",
          notes: notes || "Agendado via WhatsApp Bot",
        },
      });

      return { appointment, patient };
    });

    return NextResponse.json({
      success: true,
      data: {
        appointmentId: result.appointment.id,
        phone: result.patient.phone,
        patientName: result.patient.name,
        date: result.appointment.date,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Erro na criação de agendamento:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.flatten() }, { status: 400 });
    }

    if (error instanceof Error && error.message === "SLOT_BUSY") {
       return NextResponse.json({ error: "Horário indisponível" }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}