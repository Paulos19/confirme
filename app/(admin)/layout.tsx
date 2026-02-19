// app/(admin)/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Sidebar Fixa (Desktop) */}
      <Sidebar />
      
      {/* Container Principal */}
      <div className="flex flex-col w-full transition-all sm:pl-14 lg:pl-64">
        {/* Header Dinâmico */}
        <Header userEmail={session.user?.email} />
        
        {/* Conteúdo da Página */}
        <main className="flex-1 items-start p-4 sm:px-6 sm:py-6 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}