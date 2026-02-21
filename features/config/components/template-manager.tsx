// features/config/components/template-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { 
  saveTemplateAction, 
  setActiveTemplateAction, 
  deleteTemplateAction 
} from "@/actions/template.action";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, CheckCircle2, Plus, Trash2, MessageSquare, Info } from "lucide-react";

interface Template {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
}

export function TemplateManager({ templates }: { templates: Template[] }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Estado do Editor
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id || null);
  const [editName, setEditName] = useState(templates[0]?.name || "");
  const [editContent, setEditContent] = useState(templates[0]?.content || "");

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSelectTemplate = (t: Template) => {
    setSelectedId(t.id);
    setEditName(t.name);
    setEditContent(t.content);
    setFeedback(null);
  };

  const handleNewTemplate = () => {
    setSelectedId(null);
    setEditName("Novo Template");
    setEditContent("Olá {{patientName}}...");
    setFeedback(null);
  };

  const handleSave = () => {
    if (!editName.trim() || !editContent.trim()) {
      showFeedback("error", "Nome e conteúdo são obrigatórios.");
      return;
    }
    startTransition(async () => {
      const result = await saveTemplateAction(selectedId, editName, editContent);
      if (result.success) showFeedback("success", "Template salvo!");
      else showFeedback("error", result.error || "Erro ao salvar.");
    });
  };

  const handleSetActive = (id: string) => {
    startTransition(async () => {
      const result = await setActiveTemplateAction(id);
      if (result.success) showFeedback("success", "Template ativado com sucesso!");
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem a certeza que deseja apagar este template?")) return;
    startTransition(async () => {
      const result = await deleteTemplateAction(id);
      if (result.success) {
        showFeedback("success", "Template apagado.");
        handleNewTemplate(); // Reseta o editor
      }
      else showFeedback("error", result.error || "Erro ao apagar.");
    });
  };

  const variables = [
    { label: "{{patientName}}", desc: "Nome do Paciente" },
    { label: "{{doctor}}", desc: "Nome do Médico" },
    { label: "{{date}}", desc: "Data completa" },
    { label: "{{dataCurta}}", desc: "Ex: 19/02" },
    { label: "{{diaSemana}}", desc: "Ex: SEGUNDA" },
    { label: "{{time}}", desc: "Ex: 08:30" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      
      {/* COLUNA ESQUERDA: LISTA DE TEMPLATES */}
      <div className="flex flex-col gap-4">
        <Button onClick={handleNewTemplate} variant="outline" className="w-full justify-start h-10 border-dashed border-slate-300 text-primary hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Template
        </Button>

        <div className="flex flex-col gap-2">
          {templates.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">Nenhum template criado.</p>
          )}
          {templates.map((t) => (
            <div 
              key={t.id} 
              onClick={() => handleSelectTemplate(t)}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 shadow-sm relative overflow-hidden group
                ${selectedId === t.id ? "bg-white border-primary/40 ring-1 ring-primary/10" : "bg-slate-50/50 border-slate-200/60 hover:bg-white hover:border-slate-300"}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm truncate">
                  <MessageSquare className={`w-3.5 h-3.5 ${t.isActive ? "text-emerald-500" : "text-slate-400"}`} />
                  <span className="truncate">{t.name}</span>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                {t.isActive ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0">
                    Ativo no Disparo
                  </Badge>
                ) : (
                  <span className="text-[10px] text-slate-400">Inativo</span>
                )}
              </div>

              {/* Botão de Apagar aparece no Hover */}
              {!t.isActive && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                  className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* COLUNA DIREITA: EDITOR */}
      <div className="flex flex-col gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-slate-100/80 bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex flex-col gap-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nome do Template</label>
                <Input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 text-sm font-bold text-slate-800 border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl"
                  placeholder="Ex: Lembrete Matinal"
                />
              </div>

              <div className="flex items-center gap-2 pt-4 sm:pt-0">
                {selectedId && (
                  <Button 
                    onClick={() => handleSetActive(selectedId)} 
                    disabled={isPending || templates.find(t => t.id === selectedId)?.isActive}
                    variant="outline"
                    className="h-10 rounded-xl text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Definir como Ativo
                  </Button>
                )}
                <Button onClick={handleSave} disabled={isPending} className="h-10 rounded-xl text-xs font-semibold shadow-sm">
                  {isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Salvar
                </Button>
              </div>
            </div>

            {feedback && (
              <div className={`text-xs font-bold px-3 py-2 rounded-lg ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {feedback.msg}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Corpo da Mensagem (WhatsApp)</label>
              <Textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[350px] font-mono text-xs leading-relaxed resize-y bg-slate-50/80 focus:bg-white border-slate-200 rounded-xl p-4 shadow-inner"
                placeholder="Olá {{patientName}}..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Guia de Variáveis */}
        <Card className="border-0 shadow-sm ring-1 ring-blue-100 bg-blue-50/30 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs mb-3">
              <Info className="w-4 h-4" /> Variáveis Dinâmicas Disponíveis
            </div>
            <div className="flex flex-wrap gap-2">
              {variables.map(v => (
                <div key={v.label} className="flex items-center gap-1.5 bg-white border border-blue-100 rounded-lg px-2.5 py-1 shadow-sm">
                  <code className="text-[10px] font-bold text-blue-700">{v.label}</code>
                  <span className="text-[10px] text-slate-400 border-l border-slate-100 pl-1.5">{v.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}