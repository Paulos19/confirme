// actions/template.action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTemplatesAction() {
  try {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, templates };
  } catch (error) {
    return { success: false, templates: [] };
  }
}

export async function saveTemplateAction(id: string | null, name: string, content: string) {
  try {
    // Se não existir nenhum template, o primeiro a ser criado fica logo ativo
    const count = await prisma.messageTemplate.count();
    const shouldBeActive = count === 0;

    if (id) {
      await prisma.messageTemplate.update({
        where: { id },
        data: { name, content },
      });
    } else {
      await prisma.messageTemplate.create({
        data: { name, content, isActive: shouldBeActive },
      });
    }
    
    revalidatePath("/dashboard/config");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Falha ao salvar template." };
  }
}

export async function setActiveTemplateAction(id: string) {
  try {
    // Desativa todos
    await prisma.messageTemplate.updateMany({
      data: { isActive: false },
    });
    // Ativa apenas o selecionado
    await prisma.messageTemplate.update({
      where: { id },
      data: { isActive: true },
    });

    revalidatePath("/dashboard/config");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Falha ao ativar template." };
  }
}

export async function deleteTemplateAction(id: string) {
  try {
    const template = await prisma.messageTemplate.findUnique({ where: { id } });
    if (template?.isActive) {
      return { success: false, error: "Não pode apagar o template ativo. Ative outro primeiro." };
    }

    await prisma.messageTemplate.delete({ where: { id } });
    revalidatePath("/dashboard/config");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Falha ao apagar." };
  }
}