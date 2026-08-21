// ╭──────────────────────────────╮
// │  Mini ROM Identity Tests     │
// │  Locks stock, modified and   │
// │  invalid-file distinctions.  │
// ╰──────────────────────────────╯

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateGbaHeaderChecksum,
  GBAOS_ROM_SIZE,
  inspectGbaOs,
  sha256Hex,
  STOCK_GBAOS_HASHES,
} from "./romIdentity";

afterEach(() => vi.unstubAllGlobals());

const hashFor = (version: string) =>
  Object.entries(STOCK_GBAOS_HASHES).find(([, candidate]) => candidate === version)?.[0] ?? "";

const makeGbaOsHeader = () => {
  const bytes = new Uint8Array(GBAOS_ROM_SIZE);
  bytes.set(new TextEncoder().encode("GBA"), 0xa0);
  bytes.set(new TextEncoder().encode("EDGB"), 0xac);
  bytes.set(new TextEncoder().encode("01"), 0xb0);
  bytes[0xb2] = 0x96;
  bytes[0xbc] = 0;
  bytes[0xbd] = calculateGbaHeaderChecksum(bytes);
  return bytes;
};

describe("inspectGbaOs", () => {
  it("accepts the exact stock v1.17 identity", () => {
    const result = inspectGbaOs(makeGbaOsHeader(), hashFor("1.17"));
    expect(result.kind).toBe("supported");
    expect(result.version).toBe("1.17");
  });

  it("recognizes an older stock release without enabling it", () => {
    const result = inspectGbaOs(makeGbaOsHeader(), hashFor("1.16"));
    expect(result.kind).toBe("known-unsupported");
    expect(result.version).toBe("1.16");
  });

  it("separates a modified GBAOS-shaped ROM from stock inputs", () => {
    const result = inspectGbaOs(makeGbaOsHeader(), "a".repeat(64));
    expect(result.kind).toBe("modified");
  });

  it("rejects a different-sized file before reading its header", () => {
    const result = inspectGbaOs(new Uint8Array(512), "b".repeat(64));
    expect(result.kind).toBe("invalid");
    expect(result.reason).toContain("131,072-byte");
  });

  it("rejects a bad product header", () => {
    const bytes = makeGbaOsHeader();
    bytes.set(new TextEncoder().encode("NOPE"), 0xac);
    bytes[0xbd] = calculateGbaHeaderChecksum(bytes);
    expect(inspectGbaOs(bytes, "c".repeat(64)).kind).toBe("invalid");
  });

  it("rejects a bad header checksum", () => {
    const bytes = makeGbaOsHeader();
    bytes[0xbd] ^= 0xff;
    expect(inspectGbaOs(bytes, "d".repeat(64)).kind).toBe("invalid");
  });
});

describe("sha256Hex", () => {
  it("hashes without WebCrypto on an insecure HTTP origin", async () => {
    vi.stubGlobal("crypto", undefined);

    const digest = await sha256Hex(new TextEncoder().encode("abc"));

    expect(digest).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
