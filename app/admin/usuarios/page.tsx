import { createClient } from "@/lib/supabase/server";
import { inviteUser, setUserActive } from "./actions";

export default async function AdminUsuariosPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, email, role, is_active, total_points, created_at")
    .order("created_at");

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    editor: "Editor",
    player: "Jogador",
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Usuários</h1>

      <div className="bg-surface rounded-xl p-5 border border-white/5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Convidar novo usuário</h2>
        <form action={inviteUser} className="flex flex-wrap gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="email@exemplo.com"
            className="flex-1 min-w-48 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            name="name"
            type="text"
            placeholder="Nome"
            className="flex-1 min-w-36 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            name="role"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="player">Jogador</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Convidar
          </button>
        </form>
      </div>

      <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted">Usuário</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted">Role</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted">Pontos</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((user) => (
              <tr key={user.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{user.name ?? "—"}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-muted">{roleLabel[user.role]}</td>
                <td className="px-4 py-3 text-right font-mono text-foreground">{user.total_points}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium ${user.is_active ? "text-success" : "text-accent"}`}>
                    {user.is_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={setUserActive.bind(null, user.id, !user.is_active)}
                  >
                    <button
                      type="submit"
                      className={`text-xs px-3 py-1 rounded border transition-colors ${
                        user.is_active
                          ? "border-accent/30 text-accent hover:bg-accent/10"
                          : "border-success/30 text-success hover:bg-success/10"
                      }`}
                    >
                      {user.is_active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
