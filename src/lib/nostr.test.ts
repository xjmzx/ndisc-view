import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Event as NostrEvent } from "nostr-tools";
import { parseRelease } from "./nostr";

// Parse-conformance test — pins parseRelease to the frozen release.v1
// contract (schema/release.v1.json, canonical in xjmzx/ndisc). A failure
// means this viewer's parsing drifted from the wire. Sibling of ndisc's
// Rust `mod schema_v1` test and glmps's parse-conformance test.
function fixture(name: string): NostrEvent {
  const url = new URL(`../../schema/fixtures/${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as NostrEvent;
}

describe("parseRelease — release.v1 conformance", () => {
  it("parses a fully-populated release", () => {
    const r = parseRelease(fixture("release-31237.full.json"));
    expect(r).not.toBeNull();
    expect(r!.d).toBe("disco-vault:42");
    expect(r!.artist).toBe("Aphex Twin");
    expect(r!.title).toBe("Selected Ambient Works 85-92");
    expect(r!.medium).toBe("digital");
    expect(r!.year).toBe("1992");
    // `i` external-id tags (NIP-73) — 0-2 occurrences.
    expect(r!.externalIds).toContain("discogs:release:12345");
  });

  it("accepts a titleless release — gates on `d` alone, falls back for display", () => {
    // The conformance point: release.v1 guarantees only `d`; title/artist
    // are omitted when empty. parseRelease must NOT reject this event.
    const r = parseRelease(fixture("release-31237.titleless.json"));
    expect(r).not.toBeNull();
    expect(r!.d).toBe("disco-vault:7");
    expect(r!.title).toBe("Untitled");
    expect(r!.artist).toBe("Unknown Artist");
  });

  it("rejects an event with no `d` tag", () => {
    const noD = {
      id: "00",
      pubkey: "00",
      created_at: 0,
      kind: 31237,
      content: "",
      sig: "00",
      tags: [
        ["title", "T"],
        ["artist", "A"],
      ],
    } as unknown as NostrEvent;
    expect(parseRelease(noD)).toBeNull();
  });
});
