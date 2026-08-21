# EverTheme Pro

Browser-based theme builder for the EverDrive GBA PRO and original EverDrive GBA Mini / X5. Everything runs locally; images, fonts, and ROMs never leave the browser.

Live app: [seglectic.com/evertheme](https://www.seglectic.com/evertheme/)

## Features

- Crops ordinary images to 240×160 and reduces them to 15 GBA-safe colors.
- Previews the real 8×8 font atlas, menu layout, palettes, and background scrolling.
- Accepts prepared 128×64 font sheets and can convert TTF, OTF, or WOFF files.
- Exports cartridge-ready `.bgr` files without `gbatheme.exe`.
- Identifies stock Mini/X5 GBAOS v1.17, previews custom palettes and images, and downloads an install-ready `GBAOS.gba`.

Prepared font sheets give the most predictable results because menu glyphs are limited to 8×8 pixels.

## Run locally

```bash
npm install
npm run dev
npm test
npm run build
```

## Compatibility

The PRO compiler is tested byte-for-byte against all eight themes bundled with `gbatheme.exe` v1.0.0.0. Mini image and palette output is guarded to the exact stock GBAOS v1.17 binary and hardware-tested on an EverDrive GBA Mini / X5. EverTheme Pro is independent software and is not affiliated with Krikzz.
