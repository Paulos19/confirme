// actions/config.action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULT_TEMPLATE = `Bom dia!

📅 Consulta: *{{diaSemana}}*
{{dataCurta}} às {{time}}h
*com o Dr(a). {{doctor}}*

📍 Rua Dr. Roberto Barrozo, 1379 – Hospital Otorrinos- 2º andar
 https://maps.google.com/?q=-25.415823,-49.282524

🅿️ ESTACIONAMENTO NO LOCAL

⚠️ Chegar 15 min antes 
⚠️ Tolerância 15 min de atraso.
⚠️ UNIMED PLENO precisa estar com a consulta LIBERADA

✅ Confirma presença? 

Sem confirmação, a consulta será cancelada.‼️`;

export async function getMessageTemplateAction() {
  try {
    const config = await prisma.config.findUnique({ where: { id: "global" } });
    return { success: true, template: config?.messageTemplate || DEFAULT_TEMPLATE };
  } catch (error) {
    return { success: false, template: DEFAULT_TEMPLATE };
  }
}

export async function saveMessageTemplateAction(template: string) {
  try {
    await prisma.config.upsert({
      where: { id: "global" },
      update: { messageTemplate: template },
      create: { id: "global", messageTemplate: template },
    });
    
    revalidatePath("/dashboard/config");
    return { success: true };
  } catch (error) {
    console.error("[CONFIG_SAVE_ERROR]", error);
    return { success: false, error: "Falha ao salvar template." };
  }
}