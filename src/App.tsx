import { useCallback, useRef, useState } from "react";
import { SmartPaste } from "./components/SmartPaste/SmartPaste";
import { PlayerEditor } from "./components/PlayerEditor/PlayerEditor";
import { TeamCard } from "./components/TeamCard/TeamCard";
import { drawTeams } from "./components/Algorithm/draw";
import { ExportButton } from "./components/ExportButton/ExportButton";
import type { Player, State } from "./types";

export default function App() {
  const [state, setState] = useState<State>({ players: [], teams: null });
  const [drawErrors, setDrawErrors] = useState<string[]>([]);
  const [drawWarnings, setDrawWarnings] = useState<string[]>([]);
  const teamsRef = useRef<HTMLDivElement>(null);

  const handleParseComplete = useCallback((players: Player[]) => {
    setState((current) => ({ ...current, players, teams: null }));
    setDrawErrors([]);
    setDrawWarnings([]);
  }, []);

  const handlePlayersChange = useCallback((players: Player[]) => {
    setState((current) => ({ ...current, players, teams: null }));
    setDrawErrors([]);
    setDrawWarnings([]);
  }, []);

  const handleClear = useCallback(() => {
    setState({ players: [], teams: null });
    setDrawErrors([]);
    setDrawWarnings([]);
  }, []);

  const handleDraw = useCallback(() => {
    const result = drawTeams(state.players);
    setDrawErrors(result.errors);
    setDrawWarnings(result.warnings);
    setState((current) => ({ ...current, teams: result.errors.length ? null : result.teams }));
  }, [state.players]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-primary-dark">
      <header className="bg-primary-blue text-white shadow-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-yellow text-lg font-bold text-primary-dark" aria-hidden="true">⚑</span>
            <div>
              <h1 className="text-lg leading-tight">Volley Balancer</h1>
              <p className="text-xs text-white/80">Times de vôlei justos em 1 clique</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-white/15 px-3 py-1.5 text-xs sm:inline-flex">{state.players.length} jogador(es) nesta rodada</span>
            <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-white/15 px-2 text-sm font-semibold sm:hidden" aria-label={`${state.players.length} jogadores nesta rodada`}>
              {state.players.length}
            </span>
            <button type="button" onClick={handleClear} disabled={!state.players.length} className="min-h-10 rounded-lg border border-white/30 px-3 text-xs font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Apagar lista e times desta rodada">
              Apagar rodada
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="rounded-xl border border-primary-dark/10 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-yellow/20 text-sm font-bold text-accent-orange">1</span>
            <h2 className="text-base">Smart Paste</h2>
          </div>
          <p className="mb-4 text-sm text-primary-dark/70">Cole a lista do WhatsApp. Confira os nomes e níveis encontrados antes de continuar. Os dados ficam somente nesta página e são descartados ao atualizar ou fechar.</p>
          <SmartPaste onParseComplete={handleParseComplete} onClear={handleClear} />
          {state.players.length > 0 && <PlayerEditor players={state.players} onPlayersChange={handlePlayersChange} />}
        </div>

        <section className="mt-6 rounded-xl border border-primary-dark/10 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="draw-title">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-yellow/20 text-sm font-bold text-accent-orange">2</span>
            <h2 id="draw-title" className="text-base">Sorteio dos times</h2>
          </div>
          <p className="mb-4 text-sm text-primary-dark/70">Distribua os jogadores em três times com um levantador e cinco atletas cada.</p>
          <button type="button" onClick={handleDraw} disabled={state.players.length !== 18} className="min-h-11 w-full rounded-lg bg-primary-blue px-5 py-3 font-semibold text-white hover:bg-primary-blue/90 focus:outline-none focus:ring-2 focus:ring-primary-blue/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            Sortear times
          </button>
          {state.players.length !== 18 && <p className="mt-2 text-xs text-primary-dark/60">O sorteio fica disponível quando houver exatamente 18 jogadores.</p>}
          {drawErrors.length > 0 && <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <ul className="list-inside list-disc">{drawErrors.map((error) => <li key={error}>{error}</li>)}</ul>
          </div>}
          {drawWarnings.length > 0 && <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900" role="status">
            <p className="font-semibold">O sorteio foi gerado com pontos para revisar:</p>
            <ul className="mt-1 list-inside list-disc">{drawWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </div>}
          {state.teams && <>
            <div ref={teamsRef} className="mt-5 grid grid-cols-1 gap-4 bg-bg-base p-2 sm:p-3 md:grid-cols-3" aria-label="Times sorteados">
              {state.teams.map((team) => <TeamCard key={team.name} team={team} />)}
            </div>
            <ExportButton targetRef={teamsRef} />
          </>}
        </section>
      </main>

      <footer className="border-t border-primary-dark/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 text-center">
          <p className="text-xs text-primary-dark/50">Volley Balancer · Desenvolvido por Eliesdras</p>
        </div>
      </footer>
    </div>
  );
}
