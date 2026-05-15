import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: matches }, { data: phases }] = await Promise.all([
    supabase
      .from("matches")
      .select("status")
      .order("scheduled_at"),
    supabase
      .from("phase_schedule")
      .select("phase_key, label, status, close_at")
      .order("order_index"),
  ]);

  const finished = matches?.filter((m) => m.status === "finished").length ?? 0;
  const live = matches?.filter((m) => m.status === "live").length ?? 0;
  const scheduled = matches?.filter((m) => m.status === "scheduled").length ?? 0;
  const openPhase = phases?.find((p) => p.status === "open");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Agendadas", value: scheduled, color: "text-muted" },
          { label: "Ao Vivo", value: live, color: "text-success" },
          { label: "Finalizadas", value: finished, color: "text-primary" },
          { label: "Total", value: (matches?.length ?? 0), color: "text-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl p-4 border border-white/5">
            <p className="text-xs text-muted">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {openPhase && (
        <div className="bg-surface rounded-xl p-4 border border-success/20">
          <p className="text-xs text-muted mb-1">Fase aberta agora</p>
          <p className="text-lg font-semibold text-success">{openPhase.label}</p>
          {openPhase.close_at && (
            <p className="text-xs text-muted mt-1">
              Fecha em:{" "}
              {new Date(openPhase.close_at).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}
            </p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/admin/partidas"
          className="bg-surface rounded-xl p-5 border border-white/5 hover:border-primary/30 transition-colors group"
        >
          <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            Inserir Resultados →
          </h2>
          <p className="text-sm text-muted mt-1">
            Registre placares das partidas e dispare o recálculo de pontos.
          </p>
        </Link>
        <Link
          href="/admin/fases"
          className="bg-surface rounded-xl p-5 border border-white/5 hover:border-primary/30 transition-colors group"
        >
          <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            Controle de Fases →
          </h2>
          <p className="text-sm text-muted mt-1">
            Abra ou feche fases manualmente, sobrepondo a automação do cron.
          </p>
        </Link>
      </div>
    </div>
  );
}
