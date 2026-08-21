// ╭──────────────────────────────╮
// │  GBA Color Model             │
// │  Converts browser colors and │
// │  hardware BGR555 values.     │
// ╰──────────────────────────────╯

export type GbaColorChannels = {
  red: number;
  green: number;
  blue: number;
};

const parseRgb = (hex: string) => {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(hex);
  if (!match) throw new Error(`Invalid color: ${hex}`);
  return match.slice(1).map((channel) => Number.parseInt(channel, 16));
};

const expandChannel = (channel: number) => (channel << 3) | (channel >> 2);

export const quantizeGbaChannel = (channel: number) => expandChannel(Math.min(255, Math.max(0, Math.round(channel))) >> 3);

export const hexToGbaChannels = (hex: string): GbaColorChannels => {
  const [red, green, blue] = parseRgb(hex);
  return { red: red >> 3, green: green >> 3, blue: blue >> 3 };
};

export const gbaChannelsToHex = ({ red, green, blue }: GbaColorChannels) => {
  const channels = [red, green, blue].map((channel) => expandChannel(Math.min(31, Math.max(0, Math.round(channel)))));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};

export const rgb888ToBgr555 = (hex: string) => {
  const { red, green, blue } = hexToGbaChannels(hex);
  return red | (green << 5) | (blue << 10);
};

export const bgr555ToHex = (value: number) => gbaChannelsToHex({
  red: value & 0x1f,
  green: (value >> 5) & 0x1f,
  blue: (value >> 10) & 0x1f,
});

export const quantizeGbaColor = (hex: string) => bgr555ToHex(rgb888ToBgr555(hex));

export const quantizeGbaPalette = <Colors extends object>(colors: Colors): Colors => Object.fromEntries(
  Object.entries(colors).map(([role, color]) => [role, typeof color === "string" ? quantizeGbaColor(color) : color]),
) as Colors;

const relativeLuminance = (hex: string) => {
  const channels = parseRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
};

export const contrastRatio = (first: string, second: string) => {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + .05) / (darker + .05);
};
