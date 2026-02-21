// features/config/components/template-manager.tsx
"use client";

import { useState, useTransition, useRef } from "react";
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
import { Loader2, Save, CheckCircle2, Plus, Trash2, MessageSquare, Info, Zap } from "lucide-react";

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

  // Estados do Autocomplete "Notion-Style"
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [insertPosition, setInsertPosition] = useState<{ start: number; end: number } | null>(null);

  const variables = [
    { label: "{{patientName}}", desc: "Nome do Paciente", value: "{{patientName}}" },
    { label: "{{doctor}}", desc: "Nome do Médico", value: "{{doctor}}" },
    { label: "{{date}}", desc: "Data completa (DD/MM/AAAA)", value: "{{date}}" },
    { label: "{{dataCurta}}", desc: "Apenas Dia/Mês (Ex: 19/02)", value: "{{dataCurta}}" },
    { label: "{{diaSemana}}", desc: "Dia da Semana (Ex: SEGUNDA)", value: "{{diaSemana}}" },
    { label: "{{time}}", desc: "Horário da consulta", value: "{{time}}" },
  ];

  // Filtra as variáveis baseadas no que o user digitou após "{{"
  const filteredVariables = variables.filter(v =>
    v.label.toLowerCase().includes(filterText.toLowerCase())
  );

  // Lógica de Autocomplete: Avalia a posição do cursor
  const updateSuggestions = (val: string, cursor: number) => {
    const textBeforeCursor = val.slice(0, cursor);
    // Regex: Procura por "{{" seguido de qualquer letra até ao cursor, desde que não tenha "}"
    const match = textBeforeCursor.match(/\{\{([^}]*)$/);
    
    if (match) {
      setShowSuggestions(true);
      setFilterText(match[1]);
      setInsertPosition({ start: cursor - match[0].length, end: cursor });
    } else {
      setShowSuggestions(false);
      setInsertPosition(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditContent(val);
    updateSuggestions(val, e.target.selectionStart);
  };

  const handleTextClickOrKey = (e: React.MouseEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    updateSuggestions(target.value, target.selectionStart);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Interceta o Enter e Esc se o menu estiver aberto
    if (showSuggestions) {
      if (e.key === "Enter" && filteredVariables.length > 0) {
        e.preventDefault();
        insertVariable(filteredVariables[0].value);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    }
  };

  const insertVariable = (variableValue: string) => {
    if (!insertPosition || !textareaRef.current) return;

    const before = editContent.slice(0, insertPosition.start);
    const after = editContent.slice(insertPosition.end);
    const newText = before + variableValue + after;

    setEditContent(newText);
    setShowSuggestions(false);
    setInsertPosition(null);

    // Restaura o foco do cursor exatamente a seguir à variável inserida
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = before.length + variableValue.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Funções de Gestão CRUD
  const showFeedbackMsg = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSelectTemplate = (t: Template) => {
    setSelectedId(t.id);
    setEditName(t.name);
    setEditContent(t.content);
    setFeedback(null);
    setShowSuggestions(false);
  };

  const handleNewTemplate = () => {
    setSelectedId(null);
    setEditName("Novo Template");
    setEditContent("Olá {{patientName}}...");
    setFeedback(null);
    setShowSuggestions(false);
  };

  const handleSave = () => {
    if (!editName.trim() || !editContent.trim()) {
      showFeedbackMsg("error", "Nome e conteúdo são obrigatórios.");
      return;
    }
    startTransition(async () => {
      const result = await saveTemplateAction(selectedId, editName, editContent);
      if (result.success) showFeedbackMsg("success", "Template salvo com sucesso!");
      else showFeedbackMsg("error", result.error || "Erro ao salvar.");
    });
  };

  const handleSetActive = (id: string) => {
    startTransition(async () => {
      const result = await setActiveTemplateAction(id);
      if (result.success) showFeedbackMsg("success", "Template ativado com sucesso!");
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem a certeza que deseja apagar este template?")) return;
    startTransition(async () => {
      const result = await deleteTemplateAction(id);
      if (result.success) {
        showFeedbackMsg("success", "Template apagado.");
        if (selectedId === id) handleNewTemplate();
      }
      else showFeedbackMsg("error", result.error || "Erro ao apagar.");
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
      
      {/* COLUNA ESQUERDA: LISTA DE TEMPLATES */}
      <div className="flex flex-col gap-3">
        <Button onClick={handleNewTemplate} variant="outline" className="w-full justify-start h-9 border-dashed border-slate-300 text-primary hover:text-primary hover:bg-primary/5 rounded-xl transition-all text-xs font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Template
        </Button>

        <div className="flex flex-col gap-2">
          {templates.length === 0 && (
            <p className="text-[11px] text-slate-400 text-center py-4 font-medium">Nenhum template criado.</p>
          )}
          {templates.map((t) => (
            <div 
              key={t.id} 
              onClick={() => handleSelectTemplate(t)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-200 shadow-sm relative overflow-hidden group
                ${selectedId === t.id ? "bg-white border-primary/40 ring-1 ring-primary/10" : "bg-slate-50/50 border-slate-200/60 hover:bg-white hover:border-slate-300"}
              `}
            >
              <div className="flex items-start justify-between gap-2 pr-6">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs truncate">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${t.isActive ? "text-emerald-500" : "text-slate-400"}`} />
                  <span className="truncate">{t.name}</span>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                {t.isActive ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 font-bold uppercase tracking-widest">
                    Ativo
                  </Badge>
                ) : (
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Inativo</span>
                )}
              </div>

              {!t.isActive && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                  className="absolute right-1.5 top-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-opacity rounded-md"
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
        <Card className="border-0 shadow-sm ring-1 ring-slate-100/80 bg-white rounded-2xl overflow-hidden relative">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
            
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Nome do Template</label>
                <Input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 text-sm font-bold text-slate-800 border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl shadow-sm"
                  placeholder="Ex: Lembrete Matinal"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 xl:pt-5">
                {selectedId && (
                  <Button 
                    onClick={() => handleSetActive(selectedId)} 
                    disabled={isPending || templates.find(t => t.id === selectedId)?.isActive}
                    variant="outline"
                    className="h-9 rounded-xl text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Definir como Ativo
                  </Button>
                )}
                <Button onClick={handleSave} disabled={isPending} className="h-9 rounded-xl text-xs font-bold shadow-sm">
                  {isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>

            {feedback && (
              <div className={`text-xs font-bold px-3 py-2 rounded-xl ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {feedback.msg}
              </div>
            )}

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                <span>Corpo da Mensagem (WhatsApp)</span>
                <span className="text-primary flex items-center gap-1"><Zap className="w-3 h-3" /> Digite {"{{"} para Autocompletar</span>
              </label>
              
              <div className="relative">
                <Textarea 
                  ref={textareaRef}
                  value={editContent}
                  onChange={handleTextChange}
                  onClick={handleTextClickOrKey}
                  onKeyUp={handleTextClickOrKey}
                  onKeyDown={handleKeyDown}
                  className="min-h-[280px] font-mono text-xs leading-relaxed resize-y bg-slate-50/80 focus:bg-white border-slate-200 rounded-xl p-4 shadow-inner"
                  placeholder="Escreva a mensagem aqui..."
                />

                {/* THE MAGIC AUTOCOMPLETE POPUP */}
                {showSuggestions && (
                  <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[320px] bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-[0_12px_40px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 ring-1 ring-black/5">
                    <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        Inserir Variável
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold bg-slate-200/50 px-1.5 py-0.5 rounded shadow-sm">
                        ENTER ↵
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5 scrollbar-hide">
                      {filteredVariables.length > 0 ? (
                        filteredVariables.map((v, index) => (
                          <button
                            key={v.label}
                            onMouseDown={(e) => {
                              // onMouseDown previne que a textarea perca o blur antes de inserirmos o texto
                              e.preventDefault();
                              insertVariable(v.value);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between group cursor-pointer
                              ${index === 0 ? "bg-primary/10 text-primary" : "hover:bg-slate-50 text-slate-700"}
                            `}
                          >
                            <code className={`text-[11px] font-bold transition-colors ${index === 0 ? "text-primary" : "text-slate-700 group-hover:text-primary"}`}>
                              {v.label}
                            </code>
                            <span className={`text-[9px] font-medium transition-colors ${index === 0 ? "text-primary/70" : "text-slate-400 group-hover:text-slate-500"}`}>
                              {v.desc}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-5 text-center text-xs font-medium text-slate-400">
                          Nenhuma variável encontrada.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guia de Variáveis (Ainda disponível para consulta rápida) */}
        <Card className="border-0 shadow-sm ring-1 ring-blue-100 bg-blue-50/40 rounded-2xl">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-[11px] uppercase tracking-widest mb-2.5">
              <Info className="w-3.5 h-3.5" /> Dicionário de Variáveis
            </div>
            <div className="flex flex-wrap gap-2">
              {variables.map(v => (
                <div key={v.label} className="flex items-center gap-1.5 bg-white border border-blue-100/60 rounded-lg px-2 py-1 shadow-sm">
                  <code className="text-[10px] font-bold text-blue-600">{v.label}</code>
                  <span className="text-[9px] text-slate-400 border-l border-slate-100 pl-1.5 font-medium">{v.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}