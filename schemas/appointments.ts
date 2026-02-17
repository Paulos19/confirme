import { z } from "zod";

export const CreateAppointmentSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  // Regex para garantir formato internacional ou nacional limpo
  phone: z.string().min(10, "Telefone inválido"), 
  // O n8n deve enviar data em formato ISO 8601 (ex: 2023-10-25T14:00:00.000Z)
  date: z.string().datetime({ message: "Formato de data inválido (ISO 8601 necessário)" }),
  notes: z.string().optional(),
});

export const UpdateAppointmentStatusSchema = z.object({
  phone: z.string().min(10),
  response: z.enum(["CONFIRM", "CANCEL", "RESCHEDULE"]), // Mapeamos a intenção do usuário
});