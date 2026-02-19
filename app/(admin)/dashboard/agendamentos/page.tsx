// app/(admin)/dashboard/agendamentos/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

import { LocalDateFilter } from "@/features/bookings/components/local-date-filter";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ResolvedBookingsPage({ searchParams }: { searchParams: SearchParams }) {
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

  // Busca APENAS os agendamentos que foram Confirmados ou Cancelados
  const appointments = await prisma.booking.findMany({
    where: { 
      dateSchedule: { equals: clinicStartDate },
      confirmationStatus: { in: ["CONFIRMED", "CANCELLED"] }
    },
    orderBy: [{ hourSchedule: "asc" }], 
  });

  const confirmedCount = appointments.filter((a) => a.confirmationStatus === "CONFIRMED").length;
  const cancelledCount = appointments.filter((a) => a.confirmationStatus === "CANCELLED").length;

  return (
    <div className="flex flex-col gap-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agendamentos Resolvidos</h2>
          <p className="text-muted-foreground mt-1">
            Pacientes que já confirmaram ou cancelaram para {clinicStartDate}.
          </p>
        </div>
        <div className="bg-card p-3 rounded-lg border shadow-sm">
          <LocalDateFilter />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presenças Confirmadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{confirmedCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vagas Libertadas (Cancelamentos)</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{cancelledCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            Resultados Finais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="w-[100px] text-center">Horário</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Especialista</TableHead>
                <TableHead className="text-right pr-6">Decisão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                    Nenhuma resposta de pacientes registada para esta data ainda.
                  </TableCell>
                </TableRow>
              )}
              {appointments.map((apt) => (
                <TableRow key={apt.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-center font-bold text-primary">
                    {apt.hourSchedule.substring(0, 5)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-base">{apt.patientName}</div>
                    <div className="text-sm text-muted-foreground">{apt.patientMobile}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    Dr(a). {apt.doctorName}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {apt.confirmationStatus === "CONFIRMED" ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 py-1 px-3">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Vai Comparecer
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 py-1 px-3">
                        <XCircle className="w-3 h-3 mr-1" /> Desmarcou
                      </Badge>
                    )}
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