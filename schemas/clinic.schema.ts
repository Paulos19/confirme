// schemas/clinic.schema.ts
import { z } from "zod";

export const clinicAuthSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().optional(),
  token_type: z.string().optional(),
});

export const clinicBookingSchema = z.object({
  id: z.number(),
  doctor: z.string(),
  doctor_id: z.number(),
  client: z.string(),
  mobile: z.string(),
  date_schedule: z.string(),
  hour_schedule: z.string(),
  status: z.string(),
});

// ATUALIZADO: Agora reflete a estrutura exata da API Clinic
export const clinicBookingsResponseSchema = z.object({
  result: z.object({
    items: z.array(clinicBookingSchema),
  }),
});

export type ClinicBooking = z.infer<typeof clinicBookingSchema>;