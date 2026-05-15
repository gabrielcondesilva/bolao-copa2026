import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateScoringRule } from "./actions";
import RecalculateButton from "./recalculate-button";

export default async function AdminPontuacaoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: rules } = await supabase
    .from("scoring_config")
    .select("id, rule_key, label, points")
    .order("rule_key");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuração de Pontuação</h1>
        <p className="text-sm text-muted mt-1">
          Alterar pontos não tem efeito retroativo até rodar o recálculo.
        </p>
      </div>

      {/* Rules table */}
      <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Regra</th>
              <th className="text-right px-4 py-3 font-medium w-28">Pontos</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {(rules ?? []).map((rule) => (
              <tr key={rule.id} className="border-b border-white/5 last:border-0">
                <form action={updateScoringRule}>
                  <input type="hidden" name="id" value={rule.id} />
                  <td className="px-4 py-2 text-foreground font-medium">{rule.label}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      name="points"
                      defaultValue={rule.points}
                      min={0}
                      max={100}
                      className="w-20 rounded bg-white/10 text-center text-sm text-foreground border border-white/10 focus:outline-none focus:border-primary py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ml-auto block"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold px-3 py-1.5 transition-colors"
                    >
                      Salvar
                    </button>
                  </td>
                </form>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mass recalculate */}
      <div className="bg-surface rounded-xl border border-white/5 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recalcular Pontuação</h2>
        <RecalculateButton />
      </div>
    </div>
  );
}
