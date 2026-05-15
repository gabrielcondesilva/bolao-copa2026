import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updatePlayerStats } from "./actions";

export default async function AdminEstatisticasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/dashboard");

  const { data: players } = await supabase
    .from("players")
    .select(`
      id, name, goals, assists, yellow_cards, red_cards,
      team:teams(name, code)
    `)
    .order("goals", { ascending: false });

  const list = (players ?? []).map((p) => ({
    ...p,
    team: Array.isArray(p.team) ? (p.team[0] ?? null) : p.team,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Estatísticas — Edição Manual</h1>
      <p className="text-sm text-muted">
        Use este formulário para corrigir estatísticas quando a integração com a API não estiver disponível.
      </p>

      <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Jogador</th>
                <th className="text-left px-4 py-3 font-medium">Seleção</th>
                <th className="text-right px-3 py-3 font-medium">Gols</th>
                <th className="text-right px-3 py-3 font-medium">Ass.</th>
                <th className="text-right px-3 py-3 font-medium">CA</th>
                <th className="text-right px-3 py-3 font-medium">CV</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((player) => (
                <tr key={player.id} className="border-b border-white/5 last:border-0">
                  <form action={updatePlayerStats}>
                    <input type="hidden" name="id" value={player.id} />
                    <td className="px-4 py-2 font-medium text-foreground">{player.name}</td>
                    <td className="px-4 py-2 text-muted">{player.team?.code ?? "—"}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="goals"
                        defaultValue={player.goals}
                        min={0}
                        className="w-14 rounded bg-white/10 text-center text-sm text-foreground border border-white/10 focus:outline-none focus:border-primary py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="assists"
                        defaultValue={player.assists}
                        min={0}
                        className="w-14 rounded bg-white/10 text-center text-sm text-foreground border border-white/10 focus:outline-none focus:border-primary py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="yellow_cards"
                        defaultValue={player.yellow_cards}
                        min={0}
                        className="w-14 rounded bg-white/10 text-center text-sm text-foreground border border-white/10 focus:outline-none focus:border-primary py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="red_cards"
                        defaultValue={player.red_cards}
                        min={0}
                        className="w-14 rounded bg-white/10 text-center text-sm text-foreground border border-white/10 focus:outline-none focus:border-primary py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
      </div>
    </div>
  );
}
