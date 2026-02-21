// app/(admin)/dashboard/config/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTemplatesAction } from "@/actions/template.action";
import { TemplateManager } from "@/features/config/components/template-manager";

export const dynamic = "force-dynamic"; // Garante que a página busca sempre do banco

export default async function ConfigPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { templates } = await getTemplatesAction();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Gestão de Templates
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Crie múltiplas mensagens e escolha qual será utilizada no próximo disparo do bot.
        </p>
      </div>

      <div className="mt-2">
        <TemplateManager templates={templates || []} />
      </div>
    </div>
  );
}