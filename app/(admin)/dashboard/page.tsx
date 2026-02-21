// app/(admin)/dashboard/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { 
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
import { StatusActionDropdown } from "@/features/bookings/components/status-action-dropdown";

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
  const eligibleToNotify = appointments.filter((a) => a.confirmationStatus !== "CANCELLED").length;

  return (
    // CONTROLO DE ALTURA ATUALIZADO: Usando 6rem de margem para maximizar uso de tela
    <div className="flex flex-col min-h-full xl:h-[calc(100vh-6rem)] gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. Header & Command Bar */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-2">
            Operações do dia <span className="bg-slate-200/60 px-2 py-0.5 rounded text-slate-700 font-semibold">{clinicStartDate}</span>
          </p>
        </div>
        
        {/* Painel de Comando Flutuante Compacto */}
        <div className="flex flex-col xl:flex-row items-center gap-3 bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/60 shadow-sm w-full xl:w-auto">
          <div className="w-full xl:w-auto"><LocalDateFilter /></div>
          <div className="h-px w-full xl:h-6 xl:w-px bg-slate-200" />
          <div className="w-full xl:flex-1"><DashboardFilter /></div>
          <div className="h-px w-full xl:h-6 xl:w-px bg-slate-200" />
          <div className="w-full xl:w-auto"><TriggerNotificationsButton date={clinicStartDate} pendingCount={eligibleToNotify} /></div>
        </div>
      </div>

      {/* 2. KPIs Compactos */}
      <div className="grid gap-4 sm:grid-cols-3 shrink-0">
        <Card className="border-0 shadow-sm ring-1 ring-slate-100/80 bg-gradient-to-br from-white to-slate-50 rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pacientes</p>
                <div className="text-3xl xl:text-4xl font-black text-slate-800 tracking-tight">{totalToday}</div>
              </div>
              <div className="bg-blue-100/50 p-2.5 rounded-xl text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm ring-1 ring-slate-100/80 bg-gradient-to-br from-white to-slate-50 rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disparos Feitos</p>
                <div className="text-3xl xl:text-4xl font-black text-slate-800 tracking-tight">{notifiedCount}</div>
              </div>
              <div className="bg-purple-100/50 p-2.5 rounded-xl text-purple-600">
                <Send className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-amber-100 bg-gradient-to-br from-amber-50/40 to-amber-100/20 rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest">Pendentes</p>
                <div className="text-3xl xl:text-4xl font-black text-amber-900 tracking-tight">{pending}</div>
              </div>
              <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Tabela Premium Densa */}
      <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm flex flex-col overflow-hidden min-h-[300px]">
        <div className="flex-1 overflow-y-auto">
          <Table className="w-full relative">
            <TableHeader className="bg-slate-50/90 backdrop-blur-md border-b border-slate-100/80 sticky top-0 z-20 shadow-sm">
              <TableRow className="hover:bg-transparent h-10">
                <TableHead className="w-[100px] text-center font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                  Horário
                </TableHead>
                <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                  Detalhes da Consulta
                </TableHead>
                <TableHead className="text-right pr-6 xl:pr-8 font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                  Gestão
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-32 text-slate-400 font-medium text-sm">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Clock className="w-6 h-6 opacity-20 mb-1" />
                      Nenhum agendamento encontrado para esta data.
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {appointments.map((apt) => {
                const formattedPhone = apt.patientMobile.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                
                return (
                  <TableRow key={apt.id} className="hover:bg-slate-50/50 transition-colors border-slate-100/60 group">
                    
                    <TableCell className="text-center align-middle py-3">
                      <div className="inline-flex items-center justify-center bg-slate-100/80 text-slate-700 font-black px-2.5 py-1 rounded-lg text-xs group-hover:bg-white transition-all">
                        {apt.hourSchedule.substring(0, 5)}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="font-bold text-slate-800 text-sm mb-1">
                        {apt.patientName}
                      </div>
                      <div className="flex flex-col xl:flex-row xl:items-center gap-y-1 gap-x-3 text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1 bg-slate-100/60 w-fit px-1.5 py-0.5 rounded-md">
                          <Phone className="w-3 h-3 text-slate-400" /> 
                          {formattedPhone}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 w-fit">
                          <Stethoscope className="w-3 h-3 text-blue-500/70" /> 
                          <span className="truncate max-w-[150px] xl:max-w-none">Dr(a). {apt.doctorName}</span>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right pr-4 xl:pr-8 align-middle py-3">
                      <div className="flex flex-col items-end gap-1.5">
                        <StatusActionDropdown bookingId={apt.id} currentStatus={apt.confirmationStatus} />
                        <div className="flex items-center justify-end gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded">
                          <Building2 className="w-2.5 h-2.5 hidden sm:block" />
                          <span>Clinic: {apt.status}</span>
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