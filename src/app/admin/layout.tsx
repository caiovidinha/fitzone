import { AdminSidebar } from "@/components/admin/Sidebar";
import { SessionGuard } from "@/app/providers";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      <div className="flex h-screen overflow-hidden bg-zinc-950">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SessionGuard>
  );
}
