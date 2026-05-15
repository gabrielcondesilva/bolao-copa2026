import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    redirect("/dashboard");
  }

  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-white/10 bg-surface px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Link href="/admin" className="text-sm font-semibold text-foreground">
            Admin
          </Link>
          <Link href="/admin/partidas" className="text-sm text-muted hover:text-foreground transition-colors">
            Partidas
          </Link>
          <Link href="/admin/fases" className="text-sm text-muted hover:text-foreground transition-colors">
            Fases
          </Link>
          {isAdmin && (
            <>
              <Link href="/admin/usuarios" className="text-sm text-muted hover:text-foreground transition-colors">
                Usuários
              </Link>
              <Link href="/admin/estatisticas" className="text-sm text-muted hover:text-foreground transition-colors">
                Estatísticas
              </Link>
              <Link href="/admin/pontuacao" className="text-sm text-muted hover:text-foreground transition-colors">
                Pontuação
              </Link>
              <Link href="/admin/logs" className="text-sm text-muted hover:text-foreground transition-colors">
                Logs
              </Link>
            </>
          )}
          <div className="flex-1" />
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground transition-colors">
            ← App
          </Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
