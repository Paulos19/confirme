import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { updateAppointmentStatus } from "@/actions/appointments";

export default async function Dashboard() {
  const session = await auth();

  if (!session) redirect("/login");

  // Busca de dados (Data Fetching otimizado)
  const appointments = await prisma.appointment.findMany({
    include: { patient: true },
    orderBy: { date: "desc" },
    take: 50, // Paginação simples para começar
  });

  // Cálculo rápido de KPIs
  const totalToday = appointments.filter(
    (a) => new Date(a.date).toDateString() === new Date().toDateString()
  ).length;
  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <h1 className="text-2xl font-semibold">Dashboard Clínica</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {session.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button size="sm" variant="outline">
                Sair
              </Button>
            </form>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {/* KPIs Cards */}
          <div className="grid gap-4 md:grid-cols-3 md:gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Agendamentos Hoje
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalToday}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendentes Confirmação
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Confirmados
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Agendamentos */}
          <Card x-chunk="dashboard-06-chunk-0">
            <CardHeader>
              <CardTitle>Agendamentos Recentes</CardTitle>
              <CardDescription>
                Gerencie os status e veja as respostas do WhatsApp em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Data/Hora</TableHead>
                    <TableHead className="hidden md:table-cell">Notas</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">
                        <div className="font-medium">{apt.patient.name}</div>
                        <div className="text-sm text-muted-foreground md:hidden">
                          {format(new Date(apt.date), "dd/MM HH:mm")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {apt.patient.phone}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={
                            apt.status === "CONFIRMED"
                              ? "default"
                              : apt.status === "CANCELED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {apt.status === "PENDING" && "Pendente"}
                          {apt.status === "CONFIRMED" && "Confirmado"}
                          {apt.status === "CANCELED" && "Cancelado"}
                          {apt.status === "RESCHEDULED" && "Reagendado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(apt.date), "PPP 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {apt.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            
                            {/* Formulários para Actions (Funciona sem JS no client se precisar) */}
                            <form action={updateAppointmentStatus}>
                              <input type="hidden" name="id" value={apt.id} />
                              <input type="hidden" name="status" value="CONFIRMED" />
                              <button className="w-full text-left">
                                <DropdownMenuItem>Confirmar Manualmente</DropdownMenuItem>
                              </button>
                            </form>

                            <form action={updateAppointmentStatus}>
                              <input type="hidden" name="id" value={apt.id} />
                              <input type="hidden" name="status" value="CANCELED" />
                              <button className="w-full text-left">
                                <DropdownMenuItem className="text-red-600">
                                  Cancelar Agendamento
                                </DropdownMenuItem>
                              </button>
                            </form>
                          </DropdownMenuContent>
                        </DropdownMenu>
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