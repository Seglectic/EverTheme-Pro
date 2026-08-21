// ╭──────────────────────────────╮
// │  GBA Color Conversion        │
// │  Converts CSS RGB colors to  │
// │  hardware BGR555 values.     │
// ╰──────────────────────────────╯

const parseRgb = (hex: string) => {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(hex);
  if (!match) throw new Error(`Invalid color: ${hex}`);
  return match.slice(1).map((channel) => Number.parseInt(channel, 16));
};

export const rgb888ToBgr555 = (hex: string) => {
  const [red, green, blue] = parseRgb(hex);
  return (red >> 3) | ((green >> 3) << 5) | ((blue >> 3) << 10);
};

export const bgr555ToHex = (value: number) => {
  const expand = (channel: number) => (channel << 3) | (channel >> 2);
  const channels = [expand(value & 0x1f), expand((value >> 5) & 0x1f), expand((value >> 10) & 0x1f)];
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};

export const quantizeMiniColor = (hex: string) => bgr555ToHex(rgb888ToBgr555(hex));
