import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Home, KeyRound, LogIn } from "lucide-react";
import { decadeOf, matchesSearch, npubToHex, type Release } from "./lib/nostr";
import { OWNER_NPUB } from "./config";
import { useReleases } from "./hooks/useReleases";
import { useProfile } from "./hooks/useProfile";
import { useSigner } from "./hooks/useSigner";
import { ReleaseCard } from "./components/ReleaseCard";
import { ReleaseDetail } from "./components/ReleaseDetail";
import { FilterRow } from "./components/FilterRow";
import { LoginModal } from "./components/LoginModal";
import { Footer } from "./components/Footer";

type Theme = "fizx" | "upleb";
const THEME_KEY = "ndisc-mobile.theme";

// Returns a chip-toggle handler for one facet's Set state.
function makeToggle(setter: Dispatch<SetStateAction<Set<string>>>) {
  return (value: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };
}

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
  const { status, logout } = useSigner();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Release | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  // Facet filters — a Set of selected values each; chips OR within a facet,
  // facets AND together (and with the search).
  const [labelSel, setLabelSel] = useState<Set<string>>(new Set());
  const [countrySel, setCountrySel] = useState<Set<string>>(new Set());
  const [decadeSel, setDecadeSel] = useState<Set<string>>(new Set());

  // Colour theme — toggled by tapping the ndisc title, mirrors the desktop.
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === "upleb" ? "upleb" : "fizx";
    } catch {
      return "fizx";
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("theme-upleb", theme === "upleb");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Facet options derived from the whole library (not the filtered subset).
  const facets = useMemo(() => {
    const labelCount = new Map<string, number>();
    const countryCount = new Map<string, number>();
    const decades = new Set<string>();
    for (const r of releases) {
      if (r.label) {
        labelCount.set(r.label, (labelCount.get(r.label) ?? 0) + 1);
      }
      if (r.country) {
        countryCount.set(r.country, (countryCount.get(r.country) ?? 0) + 1);
      }
      const d = decadeOf(r.year);
      if (d) decades.add(d);
    }
    const byCountDesc = (a: [string, number], b: [string, number]) =>
      b[1] - a[1];
    const decadeKey = (d: string) => (d.startsWith("pre") ? 0 : parseInt(d, 10));
    return {
      // Label facet is capped to the ten most-released labels.
      labels: [...labelCount.entries()]
        .sort(byCountDesc)
        .slice(0, 10)
        .map((e) => e[0]),
      countries: [...countryCount.entries()].sort(byCountDesc).map((e) => e[0]),
      decades: [...decades].sort((a, b) => decadeKey(a) - decadeKey(b)),
    };
  }, [releases]);

  const filtered = useMemo(
    () =>
      releases.filter((r) => {
        if (!matchesSearch(r, query)) return false;
        if (labelSel.size > 0 && (!r.label || !labelSel.has(r.label))) {
          return false;
        }
        if (
          countrySel.size > 0 &&
          (!r.country || !countrySel.has(r.country))
        ) {
          return false;
        }
        if (decadeSel.size > 0) {
          const d = decadeOf(r.year);
          if (!d || !decadeSel.has(d)) return false;
        }
        return true;
      }),
    [releases, query, labelSel, countrySel, decadeSel],
  );

  const anyFilter =
    query.trim() !== "" ||
    labelSel.size > 0 ||
    countrySel.size > 0 ||
    decadeSel.size > 0;

  const ownerName =
    profile?.display_name || profile?.name || "discography";

  function clearFilters() {
    setQuery("");
    setLabelSel(new Set());
    setCountrySel(new Set());
    setDecadeSel(new Set());
  }

  // Home — back to the list, search + facet filters cleared.
  function goHome() {
    setSelected(null);
    clearFilters();
  }

  return (
    <div
      className="min-h-screen max-w-md mx-auto bg-bg text-fg flex flex-col"
    >
      <header
        className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b
                   border-surface px-4 pt-[env(safe-area-inset-top)]"
      >
        {/* Permanent bar — stays on screen in both the list and detail view. */}
        <div className="flex items-center justify-between gap-3 py-3">
          <button
            type="button"
            onClick={() =>
              setTheme((t) => (t === "fizx" ? "upleb" : "fizx"))
            }
            title="Switch colour theme"
            aria-label="Switch colour theme"
            className="text-xl font-bold tracking-tight leading-none
                       transition-opacity hover:opacity-70"
          >
            n<span className="text-accent">disc</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted truncate">{ownerName}</span>
            {status === "in" ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Log out of Nostr?")) logout();
                }}
                title="Signed in — tap to log out"
                aria-label="Signed in — tap to log out"
                className="shrink-0 p-2 rounded-md bg-accent/20 text-accent
                           hover:bg-accent hover:text-bg transition-colors"
              >
                <KeyRound size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                title="Log in with a Nostr signer"
                aria-label="Log in with a Nostr signer"
                className="shrink-0 p-2 rounded-md bg-mauve/15 text-mauve
                           hover:bg-mauve hover:text-bg transition-colors"
              >
                <LogIn size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={goHome}
              title="Home"
              aria-label="Home"
              className="shrink-0 p-2 rounded-md bg-mauve/15 text-mauve
                         hover:bg-mauve hover:text-bg transition-colors"
            >
              <Home size={16} />
            </button>
          </div>
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
            className="w-3/5 mb-3 px-3 py-2 rounded-lg bg-surface text-fg
                       text-sm outline-none placeholder:text-muted"
          />
        )}
      </header>

      {selected ? (
        <ReleaseDetail
          release={selected}
          onRequireLogin={() => setLoginOpen(true)}
        />
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
              <div className="flex flex-col gap-1.5 mb-3">
                <FilterRow
                  name="label"
                  index={0}
                  options={facets.labels}
                  selected={labelSel}
                  onToggle={makeToggle(setLabelSel)}
                />
                <FilterRow
                  name="country"
                  index={1}
                  options={facets.countries}
                  selected={countrySel}
                  onToggle={makeToggle(setCountrySel)}
                />
                <FilterRow
                  name="decade"
                  index={2}
                  options={facets.decades}
                  selected={decadeSel}
                  onToggle={makeToggle(setDecadeSel)}
                />
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-muted tabular-nums">
                  {filtered.length}
                  {anyFilter ? ` of ${releases.length}` : ""} releases
                </p>
                {anyFilter && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[11px] text-accent"
                  >
                    clear
                  </button>
                )}
              </div>
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
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
