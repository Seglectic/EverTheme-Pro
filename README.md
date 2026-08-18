# EverTheme Pro

EverTheme Pro is a browser-native theme builder for the EverDrive GBA PRO. Drop in a background, optionally add a font, tune the menu layout and colors, then download a cartridge-ready `.bgr` file. Image processing and compilation happen entirely in the browser.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite. For a production bundle:

```bash
npm run build
```

## Supported assets

- Backgrounds: PNG, JPEG, or WebP at any size. They are center-cropped to 240×160 and reduced to 15 GBA-safe colors.
- Background template: download a clean 240×160 PNG starter in the currently selected base color.
- Fonts: TTF, OTF, WOFF, WOFF2, or a prepared 128×64 PNG font sheet.
- Output: `.bgr` files compatible with the EverDrive GBA PRO theme menu.

The editor exposes layout presets, individual header/file-list/footer geometry, six practical palette roles, and horizontal or vertical scrolling.

## Compatibility checks

The TypeScript compiler in `src/lib/gbatheme.ts` is tested byte for byte against every output bundled with `gbatheme.exe` v1.0.0.0:

```bash
npm test
```

The official package is retained under `vendor/gbatheme` as the compatibility fixture and source of the default font/sample artwork. EverTheme Pro is independent software and is not affiliated with Krikzz.
