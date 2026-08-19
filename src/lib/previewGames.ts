// ╭──────────────────────────────╮
// │  Preview Game Library        │
// │  Builds a compact randomized │
// │  file list for the GBA mock. │
// ╰──────────────────────────────╯

export type PreviewFile = {
  name: string;
  directory: boolean;
};

export type PreviewFileList = {
  entries: PreviewFile[];
  selectedRow: number;
};

type PreviewFileRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  textX: number;
  textY: number;
};

export const PREVIEW_GAME_LIBRARY = [
  "Advance Wars.gba",
  "Advance Wars 2.gba",
  "Alien Hominid.gba",
  "Astro Boy - Omega Factor.gba",
  "Boktai.gba",
  "Boktai 2.gba",
  "Breath of Fire II.gba",
  "Castlevania - Aria.gba",
  "Castlevania - Circle.gba",
  "ChuChu Rocket.gba",
  "DK - King of Swing.gba",
  "Drill Dozer.gba",
  "F-Zero - GP Legend.gba",
  "FF Tactics Advance.gba",
  "Final Fantasy V.gba",
  "Final Fantasy VI.gba",
  "Fire Emblem.gba",
  "FE - Sacred Stones.gba",
  "Golden Sun.gba",
  "Golden Sun - Lost Age.gba",
  "Gunstar Super Heroes.gba",
  "Harvest Moon - FoMT.gba",
  "Kingdom Hearts - CoM.gba",
  "Kirby - Amazing Mirror.gba",
  "Kirby - Nightmare.gba",
  "Klonoa - Empire Dreams.gba",
  "Mario & Luigi - SSS.gba",
  "Mario Golf - Advance.gba",
  "Mario Kart - SC.gba",
  "Mario Tennis - Power.gba",
  "Mario vs Donkey Kong.gba",
  "Mega Man Zero 2.gba",
  "Mega Man Zero 3.gba",
  "Metroid Fusion.gba",
  "Metroid - Zero Mission.gba",
  "Mother 3.gba",
  "Ninja Five-O.gba",
  "Pokemon Emerald.gba",
  "Pokemon FireRed.gba",
  "Pokemon Pinball R&S.gba",
  "Rhythm Tengoku.gba",
  "Shining Soul II.gba",
  "Sonic Advance 2.gba",
  "Street Fighter Alpha 3.gba",
  "Summon Night Swordcraft.gba",
  "Super Mario Advance 4.gba",
  "Tactics Ogre.gba",
  "Tony Hawk Pro Skater 2.gba",
  "Wario Land 4.gba",
  "WarioWare Inc.gba",
  "Yggdra Union.gba",
  "Zelda - Link to Past.gba",
  "Zelda - Minish Cap.gba",
] as const;

const DIRECTORIES: PreviewFile[] = [
  { name: "SYSTEM", directory: true },
  { name: "themes", directory: true },
];

const randomIndex = (length: number, random: () => number) => Math.floor(random() * length);

export function createPreviewFileList(random: () => number = Math.random): PreviewFileList {
  const games = [...PREVIEW_GAME_LIBRARY];
  for (let index = games.length - 1; index > 0; index -= 1) {
    const target = randomIndex(index + 1, random);
    [games[index], games[target]] = [games[target], games[index]];
  }

  const gameCount = 3 + randomIndex(6, random);
  const entries = [
    ...DIRECTORIES.map((entry) => ({ ...entry })),
    ...games.slice(0, gameCount).map((name) => ({ name, directory: false })),
  ];
  const selectedRow = DIRECTORIES.length + randomIndex(gameCount, random);

  return { entries, selectedRow };
}

export function previewRowAtCanvasPoint(
  entries: PreviewFile[],
  region: PreviewFileRegion,
  canvasX: number,
  canvasY: number,
) {
  const left = region.x * 8;
  const right = left + region.width * 8;
  const top = (region.y + region.textY) * 8;
  const visibleRows = Math.max(0, Math.min(entries.length, region.height - region.textY));
  const bottom = top + visibleRows * 8;
  if (canvasX < left || canvasX >= right || canvasY < top || canvasY >= bottom) return undefined;

  return Math.floor((canvasY - top) / 8);
}
