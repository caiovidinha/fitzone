import { Navbar } from "@/components/Navbar";
import { SessionGuard } from "@/app/providers";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <div className="flex min-h-screen flex-col bg-zinc-950">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </SessionGuard>
  );
}
