import { useMemo, useState } from "react";
import type { Gender, Level, Player } from "../../types";

interface PlayerEditorProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
}

export function PlayerEditor({ players, onPlayersChange }: PlayerEditorProps) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    if (!value) return [];
    return players.filter((player) => player.name.toLocaleLowerCase().includes(value));
  }, [players, query]);

  const updatePlayer = (id: string, update: Partial<Pick<Player, "gender" | "level">>) => {
    onPlayersChange(players.map((player) => player.id === id ? { ...player, ...update } : player));
  };

  return (
    <section className="mt-6 space-y-4" aria-labelledby="player-editor-title">
      <div>
        <h3 id="player-editor-title" className="text-base font-bold">Editar jogadores</h3>
        <p className="mt-1 text-sm text-primary-dark/65">Ajuste o sexo dos jogadores e o nível dos atletas. As alterações são salvas automaticamente neste dispositivo.</p>
      </div>

      <div>
        <label htmlFor="player-search" className="mb-1 block text-sm font-medium">Buscar jogador</label>
        <input
          id="player-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Digite um nome para localizar"
          autoComplete="off"
            className="min-h-11 w-full rounded-lg border border-primary-dark/20 bg-white px-3 text-base outline-none focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 sm:text-sm"
          aria-describedby="player-search-help"
          aria-controls="player-list"
        />
        <p id="player-search-help" className="mt-1 text-xs text-primary-dark/60">
          {query.trim() ? `${matches.length} jogador(es) encontrado(s).` : "Os nomes abaixo vêm da lista colada no WhatsApp."}
        </p>
        {query.trim() && matches.length > 0 && <div className="mt-2 flex flex-wrap gap-2" aria-label="Resultados da busca">
          {matches.map((player) => <button
            key={player.id}
            type="button"
            onClick={() => document.getElementById(`player-${player.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="min-h-11 rounded-full border border-primary-blue/20 bg-primary-blue/5 px-3 py-2 text-sm text-primary-blue hover:bg-primary-blue/10"
          >
            {player.name} · {player.role === "setter" ? "Levantador" : "Atleta"}
          </button>)}
        </div>}
      </div>

      <ul id="player-list" className="space-y-2">
        {players.map((player) => <li id={`player-${player.id}`} key={player.id} className="grid grid-cols-1 gap-3 rounded-lg border border-primary-dark/10 bg-bg-base p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${player.role === "setter" ? "bg-primary-blue text-white" : "bg-accent-yellow text-primary-dark"}`} aria-label={player.role === "setter" ? "Levantador" : "Atleta"}>
              {player.role === "setter" ? "L" : "A"}
            </span>
            <span className="truncate text-sm font-semibold">{player.name}</span>
            <span className="sr-only">{player.role === "setter" ? "Levantador" : "Atleta"}</span>
          </div>

          <fieldset className="flex items-center gap-1">
            <legend className="mr-2 text-xs font-medium text-primary-dark/65">Sexo</legend>
            {(["M", "F"] as Gender[]).map((gender) => <button
              key={gender}
              type="button"
              aria-pressed={player.gender === gender}
              aria-label={`${player.name}: sexo ${gender === "M" ? "masculino" : "feminino"}`}
              onClick={() => updatePlayer(player.id, { gender })}
              className={`min-h-11 min-w-11 rounded-md border px-3 text-sm font-semibold ${player.gender === gender ? "border-primary-blue bg-primary-blue text-white" : "border-primary-dark/20 bg-white text-primary-dark hover:bg-primary-dark/5"}`}
            >{gender}</button>)}
          </fieldset>

          {player.role === "athlete" && <fieldset className="flex items-center gap-1">
            <legend className="mr-2 text-xs font-medium text-primary-dark/65">Nível</legend>
            {([1, 2, 3, 4] as Level[]).map((level) => <button
              key={level}
              type="button"
              aria-pressed={player.level === level}
              aria-label={`${player.name}: nível ${level}`}
              onClick={() => updatePlayer(player.id, { level })}
              className={`min-h-11 min-w-11 rounded-md border text-sm font-semibold ${player.level === level ? "border-accent-yellow bg-accent-yellow text-primary-dark" : "border-primary-dark/20 bg-white text-primary-dark hover:bg-primary-dark/5"}`}
            >{level}</button>)}
          </fieldset>}
        </li>)}
      </ul>
      {players.length !== 18 && <p className="text-sm text-accent-orange">Lista atual com {players.length} jogador(es). Para o sorteio, serão necessários 18.</p>}
    </section>
  );
}
