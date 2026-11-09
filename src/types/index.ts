export type Gender = "M" | "F";

export type Level = 1 | 2 | 3 | 4;

export type Role = "setter" | "athlete";

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  level: Level | null;
  role: Role;
}

export interface Team {
  name: string;
  players: Player[];
  totalLevel: number;
  genderCount: Record<Gender, number>;
}

export interface State {
  players: Player[];
  teams: Team[] | null;
}
