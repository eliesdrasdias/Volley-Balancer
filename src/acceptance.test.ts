import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { parseWhatsAppList } from "./components/SmartPaste/parser";
import { drawTeams } from "./components/Algorithm/draw";
import { ExportButton } from "./components/ExportButton/ExportButton";
import { PlayerEditor } from "./components/PlayerEditor/PlayerEditor";
import { TeamCard } from "./components/TeamCard/TeamCard";
import html2canvas from "html2canvas-pro";
import type { Gender, Player, Team } from "./types";
import App from "./App";

vi.mock("html2canvas-pro", () => ({ default: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function sampleWhatsAppList(): string {
  const athletes = Array.from({ length: 15 }, (_, index) => `Atleta ${index + 1} ${(index % 4) + 1}`).join("\n");
  return [
    "*Lista do vôlei*",
    "Data: 08/11/2026",
    "PIX: chave@example.com",
    "Valor: R$ 20,00",
    "",
    "Levantadores:",
    "Levantadora 1 1",
    "Levantador 2 2",
    "Levantador 3 3",
    "",
    "Atletas:",
    athletes,
  ].join("\n");
}

function balancedPlayers(): Player[] {
  return Array.from({ length: 18 }, (_, index) => ({
    id: `p-${index}`,
    name: `Jogador ${index + 1}`,
    gender: (index % 3 === 0 ? "F" : "M") as Gender,
    level: index < 3 ? null : ((index % 4) + 1) as Player["level"],
    role: index < 3 ? "setter" : "athlete",
  }));
}

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function teamsForUi(players: Player[]): Team[] {
  return [0, 1, 2].map((index) => {
    const members = players.slice(index * 6, (index + 1) * 6);
    return {
      name: `Time ${index + 1}`,
      players: members,
      totalLevel: members.reduce((total, player) => total + (player.role === "athlete" ? player.level ?? 0 : 0), 0),
      genderCount: {
        M: members.filter((player) => player.gender === "M").length,
        F: members.filter((player) => player.gender === "F").length,
      },
    };
  });
}

describe("aceitação do produto", () => {
  it("801 — ignora data, PIX e valor e extrai 3 levantadores e 15 atletas", () => {
    const result = parseWhatsAppList(sampleWhatsAppList());
    expect(result.errors).toEqual([]);
    expect(result.players).toHaveLength(18);
    expect(result.players.filter((player) => player.role === "setter")).toHaveLength(3);
    expect(result.players.filter((player) => player.role === "athlete")).toHaveLength(15);
    expect(result.players.slice(0, 3).every((player) => player.level === null)).toBe(true);
    expect(result.players[3].level).toBe(1);
    expect(result.warnings.some((warning) => warning.includes("Levantador"))).toBe(false);
  });

  it("ignora a seção Espera, sem incluir reservas entre os atletas", () => {
    const message = [
      "TVôlei Domingo na Estevão Gomes:",
      "14:00 as 17:00h",
      "PIX: 80786812249",
      "Valor 7,00:",
      "",
      "Levantadores",
      "1. Ton",
      "2. Kaue",
      "3. André",
      "",
      "Atletas:",
      ...["Kelly", "Fernanda", "Vagner", "MW", "Maciel", "Roseli", "Geyse", "Sheilla", "Abraão", "Jim", "Jhon", "Ramon", "Rairuz afuc", "Rafa afuc", "Andreza"].map((name, index) => `${index + 1}. ${name}`),
      "",
      "Espera:",
      "1. Reserva 1",
      "2. Reserva 2",
    ].join("\n");

    const result = parseWhatsAppList(message);
    expect(result.errors).toEqual([]);
    expect(result.players).toHaveLength(18);
    expect(result.players.some((player) => player.name.startsWith("Reserva"))).toBe(false);
    expect(result.players.filter((player) => player.role === "athlete").map((player) => player.name)).toContain("Andreza");
  });

  it("802 — cria três times de seis, cada um com um levantador e cinco atletas", () => {
    const result = drawTeams(balancedPlayers());
    expect(result.errors).toEqual([]);
    expect(result.teams).toHaveLength(3);
    for (const team of result.teams) {
      expect(team.players).toHaveLength(6);
      expect(team.players.filter((player) => player.role === "setter")).toHaveLength(1);
      expect(team.players.filter((player) => player.role === "athlete")).toHaveLength(5);
    }
  });

  it("gera distribuições diferentes entre sorteios, mantendo o equilíbrio", () => {
    const players = balancedPlayers();
    const first = drawTeams(players, seededRandom(1));
    const second = drawTeams(players, seededRandom(2));
    const signature = (teams: Team[]) => teams.map((team) => team.players.map((player) => player.id).sort().join(",")).join("|");

    expect(signature(first.teams)).not.toBe(signature(second.teams));
    for (const result of [first, second]) {
      const femaleCounts = result.teams.map((team) => team.genderCount.F);
      const levelTotals = result.teams.map((team) => team.totalLevel);
      expect(result.errors).toEqual([]);
      expect(Math.max(...femaleCounts) - Math.min(...femaleCounts)).toBeLessThanOrEqual(1);
      expect(Math.max(...levelTotals) - Math.min(...levelTotals)).toBeLessThanOrEqual(1);
    }
  });

  it("não oferece nível para levantadores no editor", () => {
    render(React.createElement(PlayerEditor, { players: balancedPlayers(), onPlayersChange: vi.fn() }));
    expect(screen.queryByRole("button", { name: "Jogador 1: nível 1" })).toBeNull();
    expect(screen.getByRole("button", { name: "Jogador 4: nível 4" })).toBeTruthy();
  });

  it("803 — mantém as somas de nível dentro da tolerância de um ponto", () => {
    const { teams, errors } = drawTeams(balancedPlayers());
    const totals = teams.map((team) => team.totalLevel);
    expect(errors).toEqual([]);
    expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(1);
  });

  it("804 — distribui M/F com diferença máxima de um jogador", () => {
    const { teams, errors } = drawTeams(balancedPlayers());
    const maleCounts = teams.map((team) => team.genderCount.M);
    const femaleCounts = teams.map((team) => team.genderCount.F);
    expect(errors).toEqual([]);
    expect(Math.max(...maleCounts) - Math.min(...maleCounts)).toBeLessThanOrEqual(1);
    expect(Math.max(...femaleCounts) - Math.min(...femaleCounts)).toBeLessThanOrEqual(1);
  });

  it("mantém as mulheres tão igualmente distribuídas quanto possível para qualquer total", () => {
    for (let women = 0; women <= 18; women++) {
      const players = balancedPlayers().map((player, index) => ({
        ...player,
        gender: (index < women ? "F" : "M") as Gender,
      }));
      const result = drawTeams(players);
      const counts = result.teams.map((team) => team.genderCount.F);
      expect(result.errors, `entrada com ${women} mulheres`).toEqual([]);
      expect(Math.max(...counts) - Math.min(...counts), `entrada com ${women} mulheres`).toBeLessThanOrEqual(1);
    }
  });

  it("805 — empilha cards em mobile e usa três colunas a partir do breakpoint desktop", () => {
    const { container } = render(React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3", "aria-label": "Times sorteados" },
      teamsForUi(balancedPlayers()).map((team) => React.createElement(TeamCard, { key: team.name, team })),
    ));
    const cards = container.querySelector('[aria-label="Times sorteados"]');
    expect(cards?.className).toContain("grid-cols-1");
    expect(cards?.className).toContain("md:grid-cols-3");
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("806 — exporta o conteúdo dos times como download JPG", async () => {
    const target = document.createElement("div");
    target.textContent = "Time 1 · Levantador · Atletas";
    const targetRef = { current: target };
    const canvas = {
      toBlob: (callback: BlobCallback) => callback(new Blob(["imagem"], { type: "image/jpeg" })),
    } as HTMLCanvasElement;
    vi.mocked(html2canvas).mockResolvedValue(canvas);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:times");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("times-volley-balancer.jpg");
    });

    render(React.createElement(ExportButton, { targetRef }));
    fireEvent.click(screen.getByRole("button", { name: "Exportar para Imagem" }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(html2canvas).toHaveBeenCalledWith(target, expect.objectContaining({ backgroundColor: "#f8fafc" }));
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it("descarta os jogadores ao reiniciar a página", () => {
    const view = render(React.createElement(App));
    fireEvent.change(view.getByRole("textbox", { name: "Lista do WhatsApp" }), { target: { value: sampleWhatsAppList() } });
    fireEvent.click(screen.getByRole("button", { name: "Processar lista" }));
    expect(screen.getByText("Editar jogadores")).toBeTruthy();

    view.unmount();
    const reopened = render(React.createElement(App));

    expect(reopened.queryByText("Editar jogadores")).toBeNull();
    expect(document.getElementById("wa")).toHaveProperty("value", "");
  });

});
