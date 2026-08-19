// ╭──────────────────────────────╮
// │  SP Shell Finishes           │
// │  Lists standard retail shell │
// │  colors for preview rotation.│
// ╰──────────────────────────────╯

const SP_FINISHES = [
  { slug: "platinum", name: "Platinum Silver" },
  { slug: "cobalt", name: "Cobalt Blue" },
  { slug: "onyx", name: "Onyx Black" },
  { slug: "flame", name: "Flame Red" },
  { slug: "pearl-blue", name: "Pearl Blue" },
  { slug: "pearl-pink", name: "Pearl Pink" },
  { slug: "graphite", name: "Graphite" },
] as const;

export function randomSpFinish() {
  return SP_FINISHES[Math.floor(Math.random() * SP_FINISHES.length)];
}
