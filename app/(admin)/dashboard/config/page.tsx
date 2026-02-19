// app/(admin)/dashboard/config/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMessageTemplateAction } from "@/actions/config.action";
import { TemplateForm } from "@/features/config/components/template-form";

export default async function ConfigPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { template } = await getMessageTemplateAction();

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Configurações</h2>
        <p className="text-slate-500 font-medium">
          Personalize a comunicação automatizada da clínica.
        </p>
      </div>

      <div className="mt-4">
        <TemplateForm initialTemplate={template} />
      </div>
    </div>
  );
}