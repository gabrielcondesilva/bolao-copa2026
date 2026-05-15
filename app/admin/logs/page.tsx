import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10));
  const offset = (pageNum - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: logs, count } = await supabase
    .from("audit_logs")
    .select(
      `id, action, entity_type, entity_id, new_value, old_value, created_at,
       actor:profiles!audit_logs_actor_id_fkey(name)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Log de Auditoria</h1>

      <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Horário (BRT)</th>
                <th className="text-left px-4 py-3 font-medium">Ator</th>
                <th className="text-left px-4 py-3 font-medium">Ação</th>
                <th className="text-left px-4 py-3 font-medium">Entidade</th>
                <th className="text-left px-4 py-3 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((log) => {
                const actor = Array.isArray(log.actor)
                  ? (log.actor[0] as { name: string | null } | null)
                  : (log.actor as { name: string | null } | null);
                const ts = new Date(log.created_at).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={log.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 text-muted tabular-nums whitespace-nowrap">{ts}</td>
                    <td className="px-4 py-2.5 text-foreground">
                      {actor?.name ?? "Sistema"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-primary/80 bg-primary/10 rounded px-1.5 py-0.5">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {log.entity_type ?? "—"}
                      {log.entity_id && (
                        <span className="ml-1 font-mono text-xs text-muted/60">
                          {log.entity_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      {log.new_value != null && (
                        <pre className="text-xs text-muted/80 truncate">
                          {JSON.stringify(log.new_value)}
                        </pre>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-xs text-muted">
              {offset + 1}–{Math.min(offset + PAGE_SIZE, count ?? 0)} de {count}
            </span>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <a
                  href={`?page=${pageNum - 1}`}
                  className="rounded-lg bg-surface border border-white/10 px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                >
                  ← Anterior
                </a>
              )}
              {pageNum < totalPages && (
                <a
                  href={`?page=${pageNum + 1}`}
                  className="rounded-lg bg-surface border border-white/10 px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                >
                  Próxima →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
