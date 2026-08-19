# EverTheme Pro

Browser-based `.bgr` theme builder for the EverDrive GBA PRO. Everything runs locally; images and fonts never leave the browser.

## Features

- Crops ordinary images to 240×160 and reduces them to 15 GBA-safe colors.
- Previews the real 8×8 font atlas, menu layout, palettes, and background scrolling.
- Accepts prepared 128×64 font sheets and can convert TTF, OTF, or WOFF files.
- Exports cartridge-ready `.bgr` files without `gbatheme.exe`.

Prepared font sheets give the most predictable results because menu glyphs are limited to 8×8 pixels.

## Run locally

```bash
npm install
npm run dev
npm test
npm run build
```

## Compatibility

The compiler is tested byte-for-byte against all eight themes bundled with `gbatheme.exe` v1.0.0.0. Those fixtures are retained in `vendor/gbatheme`. EverTheme Pro is independent software and is not affiliated with Krikzz.
