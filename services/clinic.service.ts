// services/clinic.service.ts
import { clinicBookingsResponseSchema } from "@/schemas/clinic.schema";
import { getClinicAccessToken } from "./clinic-auth.service";

export async function fetchClinicBookings(startDate: string, endDate: string) {
  const {
    CLINIC_API_URL,
    CLINIC_FACILITY_ID,
    CLINIC_DOCTOR_ID,
    CLINIC_ADDRESS_ID,
  } = process.env;

  // Prática de Arquiteto: Fail-fast se as variáveis de ambiente essenciais faltarem
  if (!CLINIC_API_URL || !CLINIC_FACILITY_ID || !CLINIC_DOCTOR_ID) {
    throw new Error("[CONFIG_ERROR] Variáveis de ambiente da Clinic API ausentes.");
  }

  const url = `${CLINIC_API_URL}/api/v1/integration/facilities/${CLINIC_FACILITY_ID}/doctors/${CLINIC_DOCTOR_ID}/addresses/${CLINIC_ADDRESS_ID ?? "1"}/bookings?start_date=${startDate}&end_date=${endDate}`;

  console.log(`[CLINIC_API] Iniciando fetch para o período: ${startDate} a ${endDate}`);
  console.log(`[CLINIC_API] URL: ${url}`);

  // Recupera o token (do cache ou busca um novo)
  const accessToken = await getClinicAccessToken();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`, 
    },
    cache: "no-store", 
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[CLINIC_API_HTTP_ERROR]", response.status, errorText);
    throw new Error(`Clinic API HTTP Error: ${response.status}`);
  }

  const data = await response.json();
  
  // ==========================================
  // DEBUG CRÍTICO: INSPEÇÃO DO PAYLOAD LEGADO
  // ==========================================
  console.log("========== PAYLOAD RAW DA API CLINIC ==========");
  console.log(JSON.stringify(data, null, 2));
  console.log("===============================================");

  try {
    // Tenta validar e aplicar o contrato rigoroso do Zod
    const parsedData = clinicBookingsResponseSchema.parse(data);
    
    // Retorna apenas o array para a Action consumir
    return parsedData.result.items;
  } catch (error) {
    console.error("[ZOD_VALIDATION_ERROR] A API retornou um formato inesperado.");
    console.error(error); 
    throw new Error("Falha na validação de contrato (Zod). Verifique os logs do servidor.");
  }
}