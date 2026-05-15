import Link from "next/link";
import CountdownTimer from "@/components/landing/countdown-timer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-10">
        <div className="space-y-4">
          <div className="text-5xl sm:text-7xl">⚽</div>
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground tracking-tight">
            Bolão{" "}
            <span className="text-primary">Copa 2026</span>
          </h1>
          <p className="text-muted max-w-md mx-auto text-lg">
            Faça seus palpites, acompanhe ao vivo e dispute o primeiro lugar com seus amigos.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Primeiro jogo em
          </p>
          <CountdownTimer />
          <p className="text-xs text-muted/70">11 de junho de 2026, 16:00 BRT</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-primary px-8 py-3.5 font-semibold text-white text-sm hover:bg-primary/90 transition-colors"
          >
            Entrar no Bolão
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/15 px-8 py-3.5 font-semibold text-muted text-sm hover:text-foreground hover:border-white/30 transition-colors"
          >
            Login
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl w-full mt-4">
          {[
            { icon: "🎯", title: "Palpites por fase", desc: "Grupos, oitavas, quartas, semi e final. Cada fase abre e fecha automaticamente." },
            { icon: "⚡", title: "Ao vivo", desc: "Placar e classificação atualizados em tempo real durante os jogos." },
            { icon: "🏆", title: "Classificação", desc: "Dispute ponto a ponto com o grupo. Delta de posição atualizado diariamente." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-surface rounded-xl border border-white/5 p-4 text-left">
              <div className="text-2xl mb-2">{icon}</div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-xs text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted/50">
        Copa do Mundo FIFA 2026
      </footer>
    </div>
  );
}
