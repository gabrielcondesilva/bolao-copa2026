import { createClient } from "@/lib/supabase/server";
import PhaseOverrideForm from "./phase-override-form";

export default async function AdminFasesPage() {
  const supabase = await createClient();

  const { data: phases } = await supabase
    .from("phase_schedule")
    .select("id, phase_key, label, order_index, status, open_at, close_at, override_at, override_reason")
    .order("order_index");

  const statusLabel: Record<string, string> = {
    pending: "Pendente",
    open: "Aberta",
    closed: "Fechada",
  };

  const statusColor: Record<string, string> = {
    pending: "text-muted",
    open: "text-success",
    closed: "text-accent",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Controle de Fases</h1>
        <p className="text-sm text-muted mt-1">
          As fases são abertas/fechadas automaticamente pelo cron. Use os controles abaixo para sobrepor manualmente.
        </p>
      </div>

      <div className="space-y-3">
        {(phases ?? []).map((phase) => (
          <div
            key={phase.id}
            className="bg-surface rounded-xl p-5 border border-white/5 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-foreground">{phase.label}</h2>
                  <span className={`text-xs font-medium ${statusColor[phase.status]}`}>
                    {statusLabel[phase.status]}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-muted">
                  {phase.open_at && (
                    <span>
                      Abre:{" "}
                      {new Date(phase.open_at).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </span>
                  )}
                  {phase.close_at && (
                    <span>
                      Fecha:{" "}
                      {new Date(phase.close_at).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </span>
                  )}
                </div>
                {phase.override_at && (
                  <p className="text-xs text-muted mt-1">
                    Override em{" "}
                    {new Date(phase.override_at).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                    {phase.override_reason && ` — "${phase.override_reason}"`}
                  </p>
                )}
              </div>
            </div>

            <PhaseOverrideForm phase={phase} />
          </div>
        ))}
      </div>
    </div>
  );
}
