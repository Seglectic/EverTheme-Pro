// ╭──────────────────────────────╮
// │  Preview Game Tests          │
// │  Guards randomized file-list │
// │  bounds and display limits.  │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { createPreviewFileList, previewRowAtCanvasPoint, PREVIEW_GAME_LIBRARY } from "./previewGames";

const seededRandom = (initialSeed: number) => {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
    return seed / 0x1_0000_0000;
  };
};

describe("preview game list", () => {
  it("shows two folders followed by 3 to 8 unique games", () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const { entries, selectedRow } = createPreviewFileList(seededRandom(seed));
      const games = entries.slice(2);

      expect(entries.slice(0, 2).map((entry) => entry.name)).toEqual(["SYSTEM", "themes"]);
      expect(entries.slice(0, 2).every((entry) => entry.directory)).toBe(true);
      expect(games.length).toBeGreaterThanOrEqual(3);
      expect(games.length).toBeLessThanOrEqual(8);
      expect(games.every((entry) => !entry.directory)).toBe(true);
      expect(new Set(games.map((entry) => entry.name)).size).toBe(games.length);
      expect(selectedRow).toBeGreaterThanOrEqual(2);
      expect(selectedRow).toBeLessThan(entries.length);
    }
  });

  it("keeps every filename within the default 28-column file region", () => {
    expect(PREVIEW_GAME_LIBRARY.every((name) => name.length <= 28)).toBe(true);
  });

  it("hit-tests visible folder and game rows without selecting empty space", () => {
    const { entries } = createPreviewFileList(() => 0);
    const region = { x: 1, y: 2, width: 28, height: 8, textX: 1, textY: 1 };

    expect(previewRowAtCanvasPoint(entries, region, 16, 24)).toBe(0);
    expect(previewRowAtCanvasPoint(entries, region, 16, 32)).toBe(1);
    expect(previewRowAtCanvasPoint(entries, region, 16, 40)).toBe(2);
    expect(previewRowAtCanvasPoint(entries, region, 7, 40)).toBeUndefined();
    expect(previewRowAtCanvasPoint(entries, region, 16, 80)).toBeUndefined();
  });
});
