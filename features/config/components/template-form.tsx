// features/config/components/template-form.tsx
"use client";

import { useState, useTransition } from "react";
import { saveMessageTemplateAction } from "@/actions/config.action";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Info } from "lucide-react";

export function TemplateForm({ initialTemplate }: { initialTemplate: string }) {
  const [template, setTemplate] = useState(initialTemplate);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveMessageTemplateAction(template);
      if (result.success) {
        setFeedback({ type: "success", msg: "Template salvo com sucesso!" });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: "error", msg: "Erro ao salvar." });
      }
    });
  };

  const variables = [
    { label: "{{patientName}}", desc: "Nome do Paciente" },
    { label: "{{doctor}}", desc: "Nome do Médico" },
    { label: "{{date}}", desc: "Data completa (ex: 19/02/2026)" },
    { label: "{{dataCurta}}", desc: "Data curta (ex: 19/02)" },
    { label: "{{diaSemana}}", desc: "Dia da semana (ex: SEGUNDA)" },
    { label: "{{time}}", desc: "Horário (ex: 08:30)" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg">Corpo da Mensagem</CardTitle>
          <CardDescription>
            Escreva o texto exato que o paciente receberá no WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Textarea 
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="min-h-[400px] font-mono text-sm leading-relaxed resize-y bg-slate-50"
            placeholder="Olá {{patientName}}, você tem uma consulta..."
          />
          
          <div className="flex items-center justify-between">
            {feedback && (
              <span className={`text-sm font-medium ${feedback.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {feedback.msg}
              </span>
            )}
            <Button onClick={handleSave} disabled={isPending} className="ml-auto">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Template
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="shadow-sm border-slate-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
              <Info className="w-4 h-4" /> Variáveis Dinâmicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-600 mb-4">
              Copie e cole estas tags no seu texto. Elas serão substituídas automaticamente na hora do envio.
            </p>
            {variables.map(v => (
              <div key={v.label} className="flex flex-col gap-1 border-b border-blue-100 pb-2 last:border-0">
                <Badge variant="secondary" className="w-fit font-mono text-xs bg-white border-slate-200 cursor-copy">
                  {v.label}
                </Badge>
                <span className="text-xs text-slate-500">{v.desc}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}