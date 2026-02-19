// app/(admin)/dashboard/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, Clock, Send, Users } from "lucide-react";

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

  // Busca TODOS os agendamentos sincronizados para este dia
  const appointments = await prisma.booking.findMany({
    where: { dateSchedule: { equals: clinicStartDate } },
    orderBy: [{ hourSchedule: "asc" }], 
  });

  const totalToday = appointments.length;
  const pending = appointments.filter((a) => a.confirmationStatus === "PENDING").length;
  // Conta quantos já receberam a mensagem via n8n
  const notifiedCount = appointments.filter((a) => a.n8nNotifiedAt !== null).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Action Bar Superior */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Centro de Operações</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Controlo de disparos e estado de notificações.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <LocalDateFilter />
          <div className="h-10 w-px bg-border hidden sm:block mx-2" />
          
          <div className="flex flex-col gap-1.5 items-end">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Acções da API</span>
            <div className="flex gap-2">
              {/* Mantém o Sync para ir buscar novos à clínica se necessário */}
              <DashboardFilter />
              <TriggerNotificationsButton date={clinicStartDate} pendingCount={pending} />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sincronizados Hoje</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalToday}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Já Notificados (n8n)</CardTitle>
            <Send className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notifiedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">mensagens enviadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardam Resposta</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pending}</div>
            <p className="text-xs text-muted-foreground mt-1">pendentes de confirmação</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Operações */}
      <Card className="shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            Visão Geral de Sincronização ({clinicStartDate})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="w-[100px] text-center">Horário</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Disparo Whatsapp</TableHead>
                <TableHead>Estado Automação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                    Sem dados locais para esta data. Utilize o botão "Sincronizar" acima.
                  </TableCell>
                </TableRow>
              )}
              {appointments.map((apt) => (
                <TableRow key={apt.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-center font-semibold text-primary">
                    {apt.hourSchedule.substring(0, 5)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{apt.patientName}</div>
                    <div className="text-xs text-muted-foreground">{apt.patientMobile}</div>
                  </TableCell>
                  <TableCell>
                    {apt.n8nNotifiedAt ? (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        Enviado às {format(new Date(apt.n8nNotifiedAt), "HH:mm")}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Não notificado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`
                        ${apt.confirmationStatus === "CONFIRMED" ? "border-green-500 text-green-600 bg-green-50" : ""}
                        ${apt.confirmationStatus === "CANCELLED" ? "border-red-500 text-red-600 bg-red-50" : ""}
                        ${apt.confirmationStatus === "PENDING" ? "border-yellow-400 text-yellow-700 bg-yellow-50" : ""}
                      `}
                    >
                      {apt.confirmationStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}