import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Event as NostrEvent } from "nostr-tools";
import { parseLabelLibrary, parseRelease } from "./nostr";

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

describe("parseLabelLibrary — labels.v1 conformance", () => {
  it("parses a valid labels.v1 manifest", () => {
    const ev = fixture("labels-31238.full.json");
    const lib = parseLabelLibrary(ev);
    expect(lib).not.toBeNull();
    expect(lib!.schemaVersion).toBe("labels.v1");
    expect(Object.keys(lib!.labels).sort()).toEqual([
      "Móatún 7",
      "Planet Mu",
      "Skam Records",
    ]);
    expect(lib!.labels["Planet Mu"].image).toBe(
      "https://i.nostr.build/bV9Z0xnHFrTVHBaB.png",
    );
  });

  it("rejects a manifest with the wrong schemaVersion", () => {
    const ev = {
      content: JSON.stringify({
        schemaVersion: "labels.v2",
        labels: { "x": { image: "https://example/x.jpg" } },
      }),
    } as unknown as NostrEvent;
    expect(parseLabelLibrary(ev)).toBeNull();
  });

  it("rejects a manifest with no labels object", () => {
    const ev = {
      content: JSON.stringify({ schemaVersion: "labels.v1" }),
    } as unknown as NostrEvent;
    expect(parseLabelLibrary(ev)).toBeNull();
  });

  it("drops entries with a non-string image — forward-compat for extra fields", () => {
    const ev = {
      content: JSON.stringify({
        schemaVersion: "labels.v1",
        labels: {
          good: { image: "https://example/good.jpg", country: "GB" },
          bad: { image: 42 },
          empty: {},
        },
      }),
    } as unknown as NostrEvent;
    const lib = parseLabelLibrary(ev);
    expect(lib).not.toBeNull();
    expect(Object.keys(lib!.labels)).toEqual(["good"]);
    expect(lib!.labels.good.image).toBe("https://example/good.jpg");
  });
});
