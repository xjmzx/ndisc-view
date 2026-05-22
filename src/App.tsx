import { useMemo, useState } from "react";
import { matchesSearch, npubToHex, type Release } from "./lib/nostr";
import { OWNER_NPUB } from "./config";
import { useReleases } from "./hooks/useReleases";
import { useProfile } from "./hooks/useProfile";
import { ReleaseCard } from "./components/ReleaseCard";
import { ReleaseDetail } from "./components/ReleaseDetail";
import { Footer } from "./components/Footer";

export default function App() {
  // The owner npub is fixed config; decode to hex once.
  const hex = useMemo(() => {
    try {
      return npubToHex(OWNER_NPUB);
    } catch {
      return undefined;
    }
  }, []);

  const { releases, loading } = useReleases(hex);
  const profile = useProfile(hex);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Release | null>(null);

  const filtered = useMemo(
    () => releases.filter((r) => matchesSearch(r, query)),
    [releases, query],
  );

  const ownerName =
    profile?.display_name || profile?.name || "discography";

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      <header
        className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b
                   border-surface px-4 pt-[env(safe-area-inset-top)]"
      >
        {/* Permanent bar — stays on screen in both the list and detail view. */}
        <div className="flex items-baseline justify-between py-3">
          <h1 className="text-xl font-bold tracking-tight leading-none">
            n<span className="text-accent">disc</span>
          </h1>
          <span className="text-xs text-muted truncate ml-3">
            {ownerName}
          </span>
        </div>
        {/* Contextual row beneath the bar — search in list view, back in
            detail view. */}
        {selected ? (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="block w-full text-left text-sm font-medium text-accent
                       pb-3"
          >
            ‹ back
          </button>
        ) : (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search releases…"
            spellCheck={false}
            className="w-full mb-3 px-3 py-2 rounded-lg bg-surface text-fg
                       text-sm outline-none placeholder:text-muted"
          />
        )}
      </header>

      {selected ? (
        <ReleaseDetail release={selected} />
      ) : (
        <main className="flex-1 px-4 py-3">
          {loading && releases.length === 0 ? (
            <p className="text-muted text-sm py-12 text-center">loading…</p>
          ) : releases.length === 0 ? (
            <p className="text-muted text-sm py-12 text-center">
              no releases found
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted tabular-nums mb-2">
                {filtered.length}
                {query.trim() ? ` of ${releases.length}` : ""} releases
              </p>
              <ul className="flex flex-col gap-2">
                {filtered.map((r) => (
                  <ReleaseCard
                    key={r.d}
                    release={r}
                    onSelect={() => setSelected(r)}
                  />
                ))}
                {filtered.length === 0 && (
                  <li className="text-muted text-sm py-8 text-center">
                    no matches
                  </li>
                )}
              </ul>
            </>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
