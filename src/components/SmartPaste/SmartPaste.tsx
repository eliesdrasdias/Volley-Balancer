import { useCallback, useState } from "react";
import type { Player } from "../../types";
import { parseWhatsAppList } from "./parser";

export function SmartPaste({ onParseComplete }: { onParseComplete: (players: Player[]) => void }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Player[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const parse = useCallback(() => {
    const result = parseWhatsAppList(text);
    setErrors(result.errors);
    setWarnings(result.warnings);
    setParsed(result.players);
    if (result.players.length > 0) onParseComplete(result.players);
  }, [text, onParseComplete]);

  const clear = useCallback(() => {
    setText("");
    setParsed([]);
    setErrors([]);
    setWarnings([]);
  }, []);

  return (
    <section className="space-y-4" aria-labelledby="smart-paste-label">
      <div>
        <label id="smart-paste-label" htmlFor="wa" className="mb-2 block text-sm font-medium text-primary-dark">
          Lista do WhatsApp
        </label>
        <textarea
          id="wa"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={'Levantadores\nJoão Silva\nMaria Santos\n\nAtletas\nCarlos Lima 3'}
          className="min-h-[220px] w-full resize-y rounded-lg border-2 bg-white p-3 font-mono text-base text-primary-dark placeholder:text-primary-dark/40 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20 sm:text-sm"
          aria-describedby="wa-help"
        />
        <p id="wa-help" className="mt-1 text-xs text-primary-dark/60">
          Inclua as seções “Levantadores” e “Atletas”. Informe nível (1–4) somente para atletas; sem nível, o padrão é 3.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={parse} disabled={!text.trim()} className="min-h-11 rounded-lg bg-primary-blue px-4 py-2.5 text-white hover:bg-primary-blue/90 disabled:opacity-50 sm:flex-none">
          Processar lista
        </button>
        <button type="button" onClick={clear} disabled={!text && !parsed.length} className="min-h-11 rounded-lg border border-primary-dark/20 px-4 py-2.5 text-primary-dark hover:bg-primary-dark/5 disabled:opacity-50 sm:flex-none">
          Limpar
        </button>
      </div>

      {errors.length > 0 && <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
        <p className="font-medium">Revise a lista:</p>
        <ul className="mt-1 list-inside list-disc">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
      </div>}
      {warnings.length > 0 && <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800" role="status">
        <p className="font-medium">Avisos:</p>
        <ul className="mt-1 max-h-24 list-inside list-disc space-y-1 overflow-y-auto">{warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul>
      </div>}

      {parsed.length > 0 && <div className="rounded-lg border border-primary-dark/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary-dark">Jogadores encontrados ({parsed.length})</h3>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${parsed.length === 18 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
            {parsed.length === 18 ? "18 jogadores" : "Lista incompleta"}
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Jogadores extraídos">
          {parsed.map((player) => <li key={player.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-primary-dark/10 bg-bg-base p-2">
            <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${player.role === "setter" ? "bg-primary-blue text-white" : "bg-accent-yellow text-primary-dark"}`} aria-label={player.role === "setter" ? "Levantador" : "Atleta"}>
              {player.role === "setter" ? "L" : "A"}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary-dark">{player.name}</span>
            {player.role === "athlete" && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-blue/10 text-xs font-bold text-primary-blue" aria-label={`Nível ${player.level}`}>{player.level}</span>}
          </li>)}
        </ul>
        {parsed.length !== 18 && <p className="mt-3 text-sm text-accent-orange">A lista precisa ter 3 levantadores e 15 atletas.</p>}
      </div>}
    </section>
  );
}
