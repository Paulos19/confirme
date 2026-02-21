// actions/template.action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Buscar todos os templates
export async function getTemplatesAction() {
  try {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, templates };
  } catch (error) {
    console.error("[GET_TEMPLATES_ERROR]", error);
    return { success: false, templates: [] };
  }
}

// 2. Criar ou Atualizar Template
export async function saveTemplateAction(id: string | null, name: string, content: string) {
  try {
    // Se não existir nenhum template no banco, o primeiro a ser criado fica automaticamente ativo
    const count = await prisma.messageTemplate.count();
    const shouldBeActive = count === 0;

    if (id) {
      // Atualizar existente
      await prisma.messageTemplate.update({
        where: { id },
        data: { name, content },
      });
    } else {
      // Criar novo
      await prisma.messageTemplate.create({
        data: { name, content, isActive: shouldBeActive },
      });
    }
    
    revalidatePath("/dashboard/config");
    return { success: true };
  } catch (error) {
    console.error("[SAVE_TEMPLATE_ERROR]", error);
    return { success: false, error: "Falha ao salvar o template." };
  }
}

// 3. Definir Template como Ativo
export async function setActiveTemplateAction(id: string) {
  try {
    // Passo A: Desativa todos os templates
    await prisma.messageTemplate.updateMany({
      data: { isActive: false },
    });
    
    // Passo B: Ativa apenas o template que o usuário clicou
    await prisma.messageTemplate.update({
      where: { id },
      data: { isActive: true },
    });

    revalidatePath("/dashboard/config");
    return { success: true };
  } catch (error) {
    console.error("[SET_ACTIVE_TEMPLATE_ERROR]", error);
    return { success: false, error: "Falha ao ativar o template." };
  }
}

// 4. Deletar Template (A FUNÇÃO SOLICITADA)
export async function deleteTemplateAction(id: string) {
  try {
    // Busca o template para verificar o status dele antes de deletar
    const template = await prisma.messageTemplate.findUnique({ 
      where: { id } 
    });

    if (!template) {
      return { success: false, error: "Template não encontrado." };
    }

    // REGRA DE NEGÓCIO: Blinda o sistema contra a deleção do template que está rodando.
    if (template.isActive) {
      return { 
        success: false, 
        error: "Operação bloqueada: Você não pode apagar o template ativo. Defina outro como ativo primeiro." 
      };
    }

    // Executa a deleção
    await prisma.messageTemplate.delete({ 
      where: { id } 
    });
    
    // Atualiza a tela
    revalidatePath("/dashboard/config");
    
    return { success: true };
  } catch (error) {
    console.error("[DELETE_TEMPLATE_ERROR]", error);
    return { success: false, error: "Falha interna ao tentar apagar o template." };
  }
}