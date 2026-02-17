export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-[400px] p-4">
        {children}
      </div>
    </div>
  );
}