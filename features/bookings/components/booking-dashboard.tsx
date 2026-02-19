// features/bookings/components/booking-dashboard.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncClinicBookingsAction } from "@/actions/booking.action";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Tipagem baseada no Prisma. (Idealmente: import { Booking } from "@prisma/client")
type BookingData = {
  id: string;
  patientName: string;
  patientMobile: string;
  dateSchedule: string;
  hourSchedule: string;
  confirmationStatus: string;
};

interface BookingDashboardProps {
  initialBookings: BookingData[];
  initialDate?: string;
}

export function BookingDashboard({ initialBookings, initialDate = "2026-02-19" }: BookingDashboardProps) {
  const router = useRouter();
  const [date, setDate] = useState<string>(initialDate);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSync = () => {
    setError(null);
    startTransition(async () => {
      // A action espera startDate e endDate. Passamos a mesma data para buscar o dia específico.
      const result = await syncClinicBookingsAction(date, date);
      
      if (result.success) {
        // Atualiza a URL. Isso faz o Server Component pai rodar novamente, 
        // buscar no Prisma e injetar os novos dados em `initialBookings`.
        const params = new URLSearchParams(window.location.search);
        params.set("date", date);
        router.push(`?${params.toString()}`);
        router.refresh();
      } else {
        setError(result.error ?? "Erro ao sincronizar com a API legada.");
      }
    });
  };

  return (
    <div className="space-y-6 p-6 bg-background rounded-lg border shadow-sm">
      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Data do Agendamento</label>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="w-auto"
          />
        </div>
        <Button onClick={handleSync} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sincronizar e Carregar
        </Button>
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Status Interno</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialBookings.length === 0 && !isPending && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                  Nenhum agendamento encontrado para esta data.
                </TableCell>
              </TableRow>
            )}
            {initialBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.patientName}</TableCell>
                <TableCell>{booking.patientMobile}</TableCell>
                <TableCell>{booking.dateSchedule} às {booking.hourSchedule.slice(0, 5)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    booking.confirmationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    booking.confirmationStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.confirmationStatus}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}