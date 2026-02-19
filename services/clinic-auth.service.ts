// services/clinic-auth.service.ts
import { clinicAuthSchema } from "@/schemas/clinic.schema";

// Cache em memória (módulo). Escopo global no processo do Node.js.
let cachedToken: string | null = null;
let tokenExpiration: number | null = null;

export async function getClinicAccessToken(): Promise<string> {
  // Retorna o token em cache se ainda for válido
  if (cachedToken && tokenExpiration && Date.now() < tokenExpiration) {
    return cachedToken;
  }

  const { CLINIC_API_URL, CLINIC_CLIENT_ID, CLINIC_CLIENT_SECRET } = process.env;

  if (!CLINIC_API_URL || !CLINIC_CLIENT_ID || !CLINIC_CLIENT_SECRET) {
    throw new Error("[AUTH_ERROR] Credenciais da API Clinic ausentes no ambiente.");
  }

  const basicAuth = Buffer.from(`${CLINIC_CLIENT_ID}:${CLINIC_CLIENT_SECRET}`).toString("base64");
  const url = `${CLINIC_API_URL}/oauth/v1/token`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    // O padrão OAuth2 Server-to-Server exige esse grant_type.
    body: new URLSearchParams({
      grant_type: "client_credentials", 
    }),
    cache: "no-store", // Nunca cachear a requisição HTTP via Next.js cache
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[CLINIC_AUTH_FAILED]", response.status, errorText);
    throw new Error(`Falha na autenticação com a API Clinic: ${response.status}`);
  }

  const data = await response.json();
  const parsed = clinicAuthSchema.parse(data);

  cachedToken = parsed.access_token;
  
  // Se a API não enviar 'expires_in', assumimos um TTL de 1 hora seguro.
  const expiresInSeconds = parsed.expires_in ?? 3600; 
  
  // Define expiração com 60 segundos de margem de segurança antes do vencimento real
  tokenExpiration = Date.now() + (expiresInSeconds * 1000) - 60000; 

  return cachedToken;
}