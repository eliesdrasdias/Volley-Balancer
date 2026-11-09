import type { Player, Team } from "../../types";

export interface DrawResult {
  teams: Team[];
  errors: string[];
  warnings: string[];
}

const TEAM_COUNT = 3;
const TEAM_SIZE = 6;

function summarize(name: string, players: Player[]): Team {
  return {
    name,
    players,
    totalLevel: players.reduce((total, player) => total + (player.role === "athlete" ? player.level ?? 0 : 0), 0),
    genderCount: {
      M: players.filter((player) => player.gender === "M").length,
      F: players.filter((player) => player.gender === "F").length,
    },
  };
}

function spread(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function permutations<T>(values: T[]): T[][] {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) => permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((tail) => [value, ...tail]));
}

function combinations(size: number, count: number): number[][] {
  const results: number[][] = [];
  const current: number[] = [];
  const choose = (start: number) => {
    if (current.length === count) {
      results.push([...current]);
      return;
    }
    for (let index = start; index <= size - (count - current.length); index++) {
      current.push(index);
      choose(index + 1);
      current.pop();
    }
  };
  choose(0);
  return results;
}

function compareScores(left: number[], right: number[]): number {
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function snakeTeamForPick(pick: number): number {
  const round = Math.floor(pick / TEAM_COUNT);
  const position = pick % TEAM_COUNT;
  return round % 2 === 0 ? position : TEAM_COUNT - 1 - position;
}

export function drawTeams(players: Player[], random: () => number = Math.random): DrawResult {
  const errors: string[] = [];
  if (players.length !== TEAM_COUNT * TEAM_SIZE) errors.push(`O sorteio exige exatamente 18 jogadores; recebidos ${players.length}.`);
  const setters = players.filter((player) => player.role === "setter");
  const athletes = players.filter((player) => player.role === "athlete");
  if (setters.length !== 3) errors.push(`O sorteio exige exatamente 3 levantadores; recebidos ${setters.length}.`);
  if (athletes.length !== 15) errors.push(`O sorteio exige exatamente 15 atletas; recebidos ${athletes.length}.`);
  if (setters.some((player) => player.level !== null)) errors.push("Levantadores não devem ter nível técnico definido.");
  if (athletes.some((player) => player.level === null)) errors.push("Todos os atletas precisam ter nível técnico de 1 a 4.");
  if (new Set(players.map((player) => player.id)).size !== players.length) errors.push("Cada jogador precisa ter um identificador único.");
  if (errors.length) return { teams: [], errors, warnings: [] };

  const levelGroups = ([1, 2, 3, 4] as const).map((level) => {
    const group = athletes.filter((athlete) => athlete.level === level);
    return {
      women: shuffle(group.filter((player) => player.gender === "F"), random),
      men: shuffle(group.filter((player) => player.gender === "M"), random),
    };
  });
  const genderPatterns = levelGroups.map((group) =>
    combinations(group.women.length + group.men.length, group.women.length).map((positions) => new Set(positions)),
  );
  const setterAssignments = permutations(setters);
  const selectedPatterns: Set<number>[] = Array(levelGroups.length);
  let bestScore: number[] | null = null;
  let bestTeams: Player[][] | null = null;
  let equallyBalancedOptions = 0;

  const evaluatePattern = () => {
    const athleteTeams: Player[][] = Array.from({ length: TEAM_COUNT }, () => []);
    let pick = 0;
    levelGroups.forEach((group, groupIndex) => {
      const women = group.women;
      const men = group.men;
      const groupSize = women.length + men.length;
      let womanIndex = 0;
      let manIndex = 0;
      for (let position = 0; position < groupSize; position++) {
        const player = selectedPatterns[groupIndex].has(position) ? women[womanIndex++] : men[manIndex++];
        athleteTeams[snakeTeamForPick(pick++)].push(player);
      }
    });

    for (const assignment of setterAssignments) {
      const femaleCounts = assignment.map((setter, index) =>
        athleteTeams[index].filter((player) => player.gender === "F").length + Number(setter.gender === "F"),
      );
      const score = [spread(femaleCounts), ...[...femaleCounts].sort((a, b) => a - b)];
      const comparison = bestScore ? compareScores(score, bestScore) : -1;
      if (comparison < 0) {
        bestScore = score;
        bestTeams = assignment.map((setter, index) => [setter, ...athleteTeams[index]]);
        equallyBalancedOptions = 1;
      } else if (comparison === 0) {
        equallyBalancedOptions++;
        if (random() < 1 / equallyBalancedOptions) {
          bestTeams = assignment.map((setter, index) => [setter, ...athleteTeams[index]]);
        }
      }
    }
  };

  const searchPatterns = (groupIndex: number) => {
    if (groupIndex === levelGroups.length) {
      evaluatePattern();
      return;
    }
    for (const pattern of genderPatterns[groupIndex]) {
      selectedPatterns[groupIndex] = pattern;
      searchPatterns(groupIndex + 1);
    }
  };
  searchPatterns(0);
  const teamPlayers = bestTeams ?? [];

  const teams = teamPlayers.map((team, index) => summarize(`Time ${index + 1}`, team));
  const warnings: string[] = [];
  const levelSpread = spread(teams.map((team) => team.totalLevel));
  const maleSpread = spread(teams.map((team) => team.genderCount.M));
  const femaleSpread = spread(teams.map((team) => team.genderCount.F));
  if (teams.some((team) => team.players.length !== TEAM_SIZE || team.players.filter((player) => player.role === "setter").length !== 1)) {
    errors.push("Falha na distribuição: cada time deve ter 6 jogadores e exatamente 1 levantador.");
  }
  if (levelSpread > 1) warnings.push(`A diferença entre as somas de nível ficou em ${levelSpread} (meta: até 1).`);
  if (maleSpread > 1 || femaleSpread > 1) warnings.push(`A diferença na distribuição de gênero ficou em M=${maleSpread}, F=${femaleSpread} (meta: até 1).`);
  return { teams, errors, warnings };
}
