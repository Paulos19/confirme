// app/dashboard/page.tsx
import { auth, signOut } from "@/auth"; // Ajuste o path se necessário
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock } from "lucide-react";

import { DashboardFilter } from "@/features/bookings/components/dashboard-filter";
import { TriggerNotificationsButton } from "@/features/bookings/components/trigger-notifications-button";

// Tipagem correta para searchParams no Next.js 15+ (Promise)
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  
  // 1. Pega a data da URL (formato do input: YYYY-MM-DD) ou usa hoje
  const urlStartDateStr = (resolvedParams.start as string) || format(new Date(), "yyyy-MM-dd");
  
  // FUNÇÃO HELPER: Converte YYYY-MM-DD para DD/MM/YYYY (formato salvo no Prisma legado)
  const formatDateToClinicLegado = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr; 
    }
  };

  // 2. Converte a data da URL para o formato exato que a API salvou no banco
  const clinicStartDate = formatDateToClinicLegado(urlStartDateStr);

  // 3. Busca no banco de dados.
  const appointments = await prisma.booking.findMany({
    where: {
      dateSchedule: {
        equals: clinicStartDate
      }
    },
    orderBy: [{ hourSchedule: "asc" }], 
  });

  // 4. Cálculo de KPIs baseados na modelagem 'Booking' plana
  const totalToday = appointments.length;
  // Pendentes são aqueles que não confirmaram e não cancelaram, independentemente de já terem sido notificados no n8n.
  const pending = appointments.filter((a) => a.confirmationStatus === "PENDING").length;
  const confirmed = appointments.filter((a) => a.confirmationStatus === "CONFIRMED").length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <h1 className="text-2xl font-semibold">Dashboard Clínica</h1>
          <div className="ml-auto flex items-center gap-4">
            
            {/* O Componente Client injetado aqui cuida do filtro de datas e sync com API legada */}
            <DashboardFilter />
            
            <div className="h-6 w-px bg-border hidden md:block" />
            
            <span className="text-sm text-muted-foreground hidden md:inline">
              {session.user?.email}
            </span>
            <form action={async () => { "use server"; await signOut(); }}>
              <Button size="sm" variant="outline">Sair</Button>
            </form>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          
          {/* Action Bar Estratégica: Cabeçalho com o botão de disparo em destaque */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium tracking-tight">Visão Geral do Dia</h2>
            
            {/* Componente que dispara o webhook para o n8n */}
            <TriggerNotificationsButton 
              date={clinicStartDate} 
              pendingCount={pending} 
            />
          </div>

          {/* KPIs Cards */}
          <div className="grid gap-4 md:grid-cols-3 md:gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agendamentos no Dia</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{totalToday}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aguardando Resposta</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{pending}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmados no App</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{confirmed}</div></CardContent>
            </Card>
          </div>

          {/* Tabela de Dados */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>Visualizando agenda do dia {clinicStartDate}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Status Automação</TableHead>
                    <TableHead>Status Clínica</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                         Nenhum agendamento encontrado no período.
                       </TableCell>
                     </TableRow>
                  )}
                  {appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.patientName}</TableCell>
                      <TableCell className="text-muted-foreground">{apt.patientMobile}</TableCell>
                      <TableCell>
                         {apt.dateSchedule} às {apt.hourSchedule.substring(0, 5)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          apt.confirmationStatus === "CONFIRMED" ? "default" : 
                          apt.confirmationStatus === "CANCELLED" ? "destructive" : "secondary"
                        }>
                          {apt.confirmationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground uppercase">{apt.status}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}