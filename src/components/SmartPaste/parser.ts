import type { Level, Player, Role } from "../../types";

export interface ParsedData {
  players: Player[];
  errors: string[];
  warnings: string[];
}

const heading = (line: string, section: "setter" | "athlete") => {
  const value = line.trim().replace(/^\*+|\*+$/g, "").replace(/:$/, "").trim();
  return section === "setter"
    ? /^levantadores?$/i.test(value)
    : /^atletas?$/i.test(value);
};

function isOtherSectionHeading(line: string): boolean {
  const value = line.trim().replace(/^\*+|\*+$/g, "").replace(/:$/, "").trim();
  return /^(?:espera|reservas?|lista de espera)$/i.test(value);
}

function ignoredLine(line: string): boolean {
  const value = line.trim().replace(/^\*+|\*+$/g, "").trim();
  return (
    !value ||
    /^\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?(?:\s.*)?$/.test(value) ||
    /^(?:data(?:\s+do\s+jogo)?|pix(?:\s+chave)?|chave|valor(?:\s+pix)?|r\$)\s*[:-]/i.test(value) ||
    /^https?:\/\//i.test(value)
  );
}

function parseLevel(line: string): { name: string; level?: Level; invalidLevel?: string } {
  // Accept a level after the name, including "Name 2", "Name - 2" and "Name (2)".
  const match = line.match(/^(.*?)(?:\s*(?:[-–—:]\s*|\(\s*|\[\s*)?([0-9]+)(?:\s*[)\]])?)\s*$/);
  if (!match) return { name: line.trim() };
  const name = match[1].trim().replace(/\s*[-–—:]\s*$/, "").trim();
  const raw = match[2];
  const numeric = Number(raw);
  if (numeric >= 1 && numeric <= 4) return { name, level: numeric as Level };
  // A trailing number is considered a level only when it is a single digit; other
  // numeric suffixes are left in the name to avoid damaging names/phone snippets.
  if (raw.length === 1) return { name, invalidLevel: raw };
  return { name: line.trim() };
}

export function parseWhatsAppList(text: string): ParsedData {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sections: Record<Role, string[]> = { setter: [], athlete: [] };
  let active: Role | null = null;

  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim().replace(/^\*+|\*+$/g, "").trim();
    if (heading(line, "setter")) { active = "setter"; continue; }
    if (heading(line, "athlete")) { active = "athlete"; continue; }
    if (isOtherSectionHeading(line)) { active = null; continue; }
    if (!active || ignoredLine(line)) continue;
    sections[active].push(line.replace(/^\s*\d+[.)]\s*/, "").trim());
  }

  if (!sections.setter.length && !sections.athlete.length) {
    errors.push("Não foi possível encontrar as seções 'Levantadores' e/ou 'Atletas'.");
  }

  const players = (Object.entries(sections) as [Role, string[]][]).flatMap(([role, lines]) =>
    lines.flatMap((line, index) => {
      if (!line) {
        warnings.push(`Nome vazio na seção ${role === "setter" ? "Levantadores" : "Atletas"}.`);
        return [];
      }
      const parsed = parseLevel(line);
      const name = parsed.name.trim();
      if (!name) {
        warnings.push(`Nome vazio na seção ${role === "setter" ? "Levantadores" : "Atletas"}.`);
        return [];
      }
      if (role === "athlete" && parsed.invalidLevel) warnings.push(`Nível inválido "${parsed.invalidLevel}" para "${name}"; use 1–4.`);
      else if (role === "athlete" && !parsed.level) warnings.push(`Nível não informado para "${name}"; padrão 3.`);
      return [{
        id: `${role}-${index}-${name.toLocaleLowerCase().replace(/\s+/g, "-")}`,
        name,
        gender: "M" as const,
        level: role === "setter" ? null : parsed.level ?? 3,
        role,
      }];
    }),
  );

  const setters = players.filter((player) => player.role === "setter").length;
  const athletes = players.length - setters;
  if (setters !== 3) errors.push(`Esperados 3 Levantadores, mas encontrados ${setters}.`);
  if (athletes !== 15) errors.push(`Esperados 15 Atletas, mas encontrados ${athletes}.`);

  const names = new Map<string, number>();
  for (const player of players) {
    const key = player.name.toLocaleLowerCase();
    names.set(key, (names.get(key) ?? 0) + 1);
  }
  for (const [name, count] of names) {
    if (count > 1) warnings.push(`Nome duplicado: "${name}" (${count}x).`);
  }

  return { players, errors, warnings };
}
