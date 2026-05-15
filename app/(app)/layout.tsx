import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/login/actions";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin" || profile?.role === "editor";

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 md:pl-56">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-surface border-r border-white/10 flex-col py-6 px-4">
        <Link href="/dashboard" className="text-lg font-bold text-foreground mb-8 block">
          ⚽ Bolão 2026
        </Link>
        <nav className="flex flex-col gap-1">
          <NavLink href="/dashboard">Início</NavLink>
          <NavLink href="/palpites">Palpites</NavLink>
          <NavLink href="/grupos">Grupos</NavLink>
          <NavLink href="/partidas">Partidas</NavLink>
          <NavLink href="/chaveamento">Chaveamento</NavLink>
          <NavLink href="/estatisticas">Estatísticas</NavLink>
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
          <form action={signOut}>
            <button className="w-full text-left text-sm text-muted hover:text-foreground px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-surface border-t border-white/10 flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
        <MobileNavLink href="/dashboard" label="Início" />
        <MobileNavLink href="/palpites" label="Palpites" />
        <MobileNavLink href="/grupos" label="Grupos" />
        <MobileNavLink href="/chaveamento" label="Bracket" />
        <MobileNavLink href="/estatisticas" label="Stats" />
      </nav>

      <main className="px-4 py-6 max-w-3xl mx-auto md:max-w-4xl">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted hover:text-foreground px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 px-4 py-3 text-muted hover:text-foreground transition-colors"
    >
      <span className="text-xs">{label}</span>
    </Link>
  );
}
