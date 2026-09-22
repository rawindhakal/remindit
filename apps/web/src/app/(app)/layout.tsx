import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    role: ((session.user as any).role as string) ?? "user",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop only */}
      <AppSidebar user={user} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader user={user} />
        <main className="flex-1 px-4 py-6 md:px-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <AppBottomNav />
    </div>
  );
}
