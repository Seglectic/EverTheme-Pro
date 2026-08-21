// ╭──────────────────────────────╮
// │  Mini ROM Identity           │
// │  Validates GBAOS headers and │
// │  recognizes stock releases.  │
// ╰──────────────────────────────╯

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export const GBAOS_ROM_SIZE = 131_072;
export const SUPPORTED_GBAOS_VERSION = "1.17";

export const STOCK_GBAOS_HASHES = {
  "123eb753ce5d92c0f11193064816ffe7585e0cd98ad34b2f80be2f051150fb73": "1.00",
  "32cbb7f114ca22f7afc31d57c6f8c57fe27a7999b454856df68069a37af72e30": "1.01",
  "4f2c967a3b41565de0c9ea2b13465f7e956b4c7a11ec9d48d564d360788b9573": "1.02",
  "08321e354977078a3e63d05245539d1be601e408f278a1611d03528cc784decb": "1.03",
  "dc9956ebfc6fb98a9ad533108285eee66c6df43b65e144f219c8038db6234646": "1.04",
  "07fdcbcf5d512d6d8a3c3e090506ca21992c346c2e5e39484ac7b2bb1e488fd3": "1.05",
  "ebe67fbcc633e2c82cb576785119958979faa829a9467c493b782075a5a5ade8": "1.10",
  "47c254907a304fba70bb73209ac3bd29d5b925c552ca2551833f4d75dd190026": "1.11",
  "93c32f4cc58aa69704758eccaac57787dbcc68b63cdb4cfa97439b3c42af36ee": "1.12",
  "eb63dd35031f8097457c1dd7afc69053c4a708016117c732ddadbc59cb491e47": "1.14",
  "de739425aeca67881d69a0f93fc28d66d50d54627ceacb3e88f6cac62b9b970c": "1.15",
  "c6a8494d7c13e9fef4f96a09958d27eec1a63ccdef836e6e09b9399af30b8b39": "1.16",
  "d6312aba8a56d7fe6c137a5b0e77d0cc8131a1c684aef8224f78bbc13a2f61ad": "1.17",
} as const;

export type MiniRomKind = "supported" | "known-unsupported" | "modified" | "invalid";

export type MiniRomHeader = {
  title: string;
  gameCode: string;
  makerCode: string;
  revision: number;
  storedChecksum: number;
  calculatedChecksum: number;
};

export type MiniRomIdentification = {
  kind: MiniRomKind;
  sha256: string;
  size: number;
  version?: string;
  header?: MiniRomHeader;
  reason: string;
};

const decodeAscii = (bytes: Uint8Array, start: number, end: number) =>
  new TextDecoder("ascii").decode(bytes.slice(start, end)).replace(/\0+$/u, "");

export const calculateGbaHeaderChecksum = (bytes: Uint8Array) => {
  let checksum = 0;
  for (let index = 0xa0; index < 0xbd; index += 1) checksum = (checksum - bytes[index]) & 0xff;
  return (checksum - 0x19) & 0xff;
};

const readHeader = (bytes: Uint8Array): MiniRomHeader => ({
  title: decodeAscii(bytes, 0xa0, 0xac),
  gameCode: decodeAscii(bytes, 0xac, 0xb0),
  makerCode: decodeAscii(bytes, 0xb0, 0xb2),
  revision: bytes[0xbc],
  storedChecksum: bytes[0xbd],
  calculatedChecksum: calculateGbaHeaderChecksum(bytes),
});

export const inspectGbaOs = (bytes: Uint8Array, sha256: string): MiniRomIdentification => {
  if (bytes.length !== GBAOS_ROM_SIZE) {
    return {
      kind: "invalid",
      sha256,
      size: bytes.length,
      reason: `Expected a 131,072-byte GBAOS ROM; this file is ${bytes.length.toLocaleString()} bytes.`,
    };
  }

  const header = readHeader(bytes);
  const headerMatches =
    header.title === "GBA" &&
    header.gameCode === "EDGB" &&
    header.makerCode === "01" &&
    bytes[0xb2] === 0x96 &&
    header.storedChecksum === header.calculatedChecksum;

  if (!headerMatches) {
    return {
      kind: "invalid",
      sha256,
      size: bytes.length,
      header,
      reason: "The file is 128 KiB, but its EverDrive GBA OS header or header checksum is invalid.",
    };
  }

  const version = STOCK_GBAOS_HASHES[sha256 as keyof typeof STOCK_GBAOS_HASHES];
  if (version === SUPPORTED_GBAOS_VERSION) {
    return {
      kind: "supported",
      sha256,
      size: bytes.length,
      version,
      header,
      reason: "Unmodified stock GBAOS v1.17 recognized. This ROM is ready for the palette phase.",
    };
  }

  if (version) {
    return {
      kind: "known-unsupported",
      sha256,
      size: bytes.length,
      version,
      header,
      reason: `Stock GBAOS v${version} recognized, but the first patch release supports v1.17 only.`,
    };
  }

  return {
    kind: "modified",
    sha256,
    size: bytes.length,
    header,
    reason: "This looks like GBAOS, but its bytes do not match a known stock release. It will not be patched automatically.",
  };
};

export const sha256Hex = async (bytes: Uint8Array) => {
  const subtle = globalThis.crypto?.subtle;

  // WebCrypto is unavailable on plain HTTP origins such as nomara.local.
  if (!subtle) return bytesToHex(sha256(bytes));

  const digest = await subtle.digest("SHA-256", Uint8Array.from(bytes));
  return bytesToHex(new Uint8Array(digest));
};

export const identifyGbaOs = async (bytes: Uint8Array) => inspectGbaOs(bytes, await sha256Hex(bytes));
