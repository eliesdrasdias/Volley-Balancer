import type { Team } from "../../types";

export function TeamCard({ team }: { team: Team }) {
  const setters = team.players.filter((player) => player.role === "setter");
  const athletes = team.players.filter((player) => player.role === "athlete");
  const valid = team.players.length === 6 && setters.length === 1 && athletes.length === 5;

  return (
    <article className="overflow-hidden rounded-xl border border-primary-dark/10 bg-white shadow-sm">
      <header className="flex items-center justify-between bg-primary-blue px-4 py-3 text-white">
        <h3 className="text-lg">{team.name}</h3>
        {!valid && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
          ⚠ {setters.length} levantador(es)
        </span>}
      </header>
      <div className="space-y-4 p-4">
        <section aria-label="Levantador">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary-blue">Levantador</h4>
          {setters.map((player) => <PlayerLine key={player.id} player={player} />)}
          {setters.length === 0 && <p className="text-sm text-red-700">Nenhum levantador</p>}
        </section>
        <section aria-label="Atletas">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary-dark/60">Atletas ({athletes.length}/5)</h4>
          <ul className="space-y-2">
            {athletes.map((player) => <li key={player.id}><PlayerLine player={player} /></li>)}
          </ul>
        </section>
        <footer className="flex items-center justify-between border-t border-primary-dark/10 pt-3 text-xs text-primary-dark/70">
          <span>Soma dos níveis dos atletas: <strong className="text-primary-dark">{team.totalLevel}</strong></span>
          <span>M {team.genderCount.M} · F {team.genderCount.F}</span>
        </footer>
      </div>
    </article>
  );
}

function PlayerLine({ player }: { player: Team["players"][number] }) {
  return <div className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg bg-bg-base px-3 py-2">
    <span className="min-w-0 flex-1 truncate text-base font-medium sm:text-sm">{player.name}</span>
    <span className="shrink-0 text-sm text-primary-dark/60">{player.gender}</span>
    {player.role === "athlete" && <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-yellow text-sm font-bold" aria-label={`Nível ${player.level}`}>{player.level}</span>}
  </div>;
}
