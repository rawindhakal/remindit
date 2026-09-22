import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user) {
    redirect("/login");
  }

  if (role !== "admin" && role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">RenewIt Admin</span>
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
                {role === "super_admin" ? "Super Admin" : "Admin"}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <AdminNav />

        {/* Current Admin User Info */}
        <div className="p-4 border-t border-slate-800 mt-auto flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{session.user.name || "Admin"}</p>
            <p className="text-[11px] text-slate-400 truncate">{session.user.email}</p>
          </div>
          <Link
            href="/dashboard"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
            title="Return to App"
          >
            App →
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 min-w-0 bg-slate-900 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
