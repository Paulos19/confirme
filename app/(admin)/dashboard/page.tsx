// app/(admin)/dashboard/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  Users, 
  Phone, 
  Stethoscope, 
  Building2 
} from "lucide-react";

import { DashboardFilter } from "@/features/bookings/components/dashboard-filter";
import { LocalDateFilter } from "@/features/bookings/components/local-date-filter";
import { TriggerNotificationsButton } from "@/features/bookings/components/trigger-notifications-button";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DashboardOverviewPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const urlStartDateStr = (resolvedParams.start as string) || format(new Date(), "yyyy-MM-dd");
  
  const formatDateToClinicLegado = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr; 
    }
  };

  const clinicStartDate = formatDateToClinicLegado(urlStartDateStr);

  const appointments = await prisma.booking.findMany({
    where: { dateSchedule: { equals: clinicStartDate } },
    orderBy: [{ hourSchedule: "asc" }], 
  });

  const totalToday = appointments.length;
  const pending = appointments.filter((a) => a.confirmationStatus === "PENDING").length;
  const notifiedCount = appointments.filter((a) => a.n8nNotifiedAt !== null).length;
  
  // NOVA REGRA DE NEGÓCIO: Quem pode receber mensagem? Todos, exceto os CANCELADOS.
  const eligibleToNotify = appointments.filter((a) => a.confirmationStatus !== "CANCELLED").length;

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* 1. Header da Página & Barra de Ferramentas */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Visão Geral</h2>
          <p className="text-slate-500 font-medium">
            Métricas e disparos para o dia <strong className="text-slate-700">{clinicStartDate}</strong>
          </p>
        </div>
        
        {/* Painel de Comando Flutuante */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 sm:pr-2 sm:pl-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-full sm:w-auto">
            <LocalDateFilter />
          </div>
          <div className="h-10 w-px bg-slate-200 hidden sm:block mx-1" />
          <div className="flex gap-2 w-full sm:w-auto">
            <DashboardFilter />
            {/* ATUALIZADO: Passamos a quantidade de elegíveis para o botão não ficar bloqueado */}
            <TriggerNotificationsButton date={clinicStartDate} pendingCount={eligibleToNotify} />
          </div>
        </div>
      </div>

      {/* 2. KPIs com Design Minimalista Apple/Linear */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Card 1 */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total de Pacientes</p>
                <div className="text-4xl font-black text-slate-800">{totalToday}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Card 2 */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Disparos (n8n)</p>
                <div className="text-4xl font-black text-slate-800">{notifiedCount}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="border-0 shadow-sm ring-1 ring-amber-100 bg-amber-50/30 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Aguardam Confirmação</p>
                <div className="text-4xl font-black text-amber-900">{pending}</div>
              </div>
              <div className="bg-amber-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Tabela de Dados (Sem bordas pesadas, design fluido) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] text-center font-bold text-slate-600 uppercase tracking-wider text-xs py-4">
                  Hora
                </TableHead>
                <TableHead className="font-bold text-slate-600 uppercase tracking-wider text-xs py-4">
                  Informação do Paciente
                </TableHead>
                <TableHead className="text-right pr-8 font-bold text-slate-600 uppercase tracking-wider text-xs py-4">
                  Estado Atual
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-40 text-slate-400 font-medium">
                    Nenhum agendamento registado para esta data.
                  </TableCell>
                </TableRow>
              )}
              {appointments.map((apt) => {
                const formattedPhone = apt.patientMobile.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                
                return (
                  <TableRow key={apt.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                    
                    {/* HORA */}
                    <TableCell className="text-center align-middle">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-sm">
                        {apt.hourSchedule.substring(0, 5)}
                      </span>
                    </TableCell>

                    {/* PACIENTE */}
                    <TableCell className="py-4">
                      <div className="font-bold text-slate-800 text-base mb-1.5">
                        {apt.patientName}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> 
                          {formattedPhone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-blue-400" /> 
                          Dr(a). {apt.doctorName}
                        </span>
                      </div>
                    </TableCell>

                    {/* ESTADO */}
                    <TableCell className="text-right pr-8 align-middle">
                      <div className="flex flex-col items-end gap-2.5">
                        <Badge 
                          variant="outline"
                          className={`
                            px-3 py-1 text-xs font-bold border-0 shadow-sm
                            ${apt.confirmationStatus === "CONFIRMED" ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200" : ""}
                            ${apt.confirmationStatus === "CANCELLED" ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200" : ""}
                            ${apt.confirmationStatus === "PENDING" ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200" : ""}
                          `}
                        >
                          {apt.confirmationStatus === "CONFIRMED" && "✓ CONFIRMADO"}
                          {apt.confirmationStatus === "CANCELLED" && "✕ CANCELADO"}
                          {apt.confirmationStatus === "PENDING" && "⌛ PENDENTE"}
                        </Badge>
                        
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <Building2 className="w-3.5 h-3.5" />
                          {apt.status}
                        </div>
                      </div>
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}