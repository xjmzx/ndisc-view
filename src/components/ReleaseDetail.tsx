import { useState } from "react";
import { Heart } from "lucide-react";
import { CoverArt } from "./CoverArt";
import { useReactions } from "../hooks/useReactions";
import { RELEASE_KIND } from "../config";
import { hostnameOf, type Release } from "../lib/nostr";

interface Props {
  release: Release;
  onRequireLogin: () => void;
}

// Detail fields shown when present, in display order.
const FIELDS = [
  ["year", "year"],
  ["medium", "medium"],
  ["format", "format"],
  ["label", "label"],
  ["catalog", "catalog"],
  ["country", "country"],
  ["condition", "condition"],
  ["type", "type"],
  ["category", "category"],
] as const;

// ♥ a release. Logged out, a tap opens the login sheet; logged in, it
// posts / revokes a kind:7 reaction.
function ReactionButton({ release, onRequireLogin }: Props) {
  const { forAddr, react, unreact, canReact } = useReactions();
  const addr = `${RELEASE_KIND}:${release.pubkey}:${release.d}`;
  const { up, mine } = forAddr(addr);
  const [busy, setBusy] = useState(false);

  async function onTap() {
    if (!canReact) {
      onRequireLogin();
      return;
    }
    setBusy(true);
    try {
      if (mine) await unreact(addr);
      else await react(addr);
    } catch {
      /* swallow — a failed publish just leaves the count as-is */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                 bg-surface active:bg-surfaceHover transition-colors
                 disabled:opacity-50"
    >
      <Heart
        size={15}
        className={mine ? "text-mauve" : "text-muted"}
        fill={mine ? "currentColor" : "none"}
      />
      <span className="text-sm tabular-nums">{up}</span>
    </button>
  );
}

// Detail body for one release. The app header is owned by App; this renders
// only the scrolling content beneath it.
export function ReleaseDetail({ release, onRequireLogin }: Props) {
  return (
    <main className="flex-1 px-4 py-4">
      <CoverArt
        src={release.image}
        alt={release.title}
        className="w-full max-w-[16rem] aspect-square rounded-xl mb-4 mx-auto"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight">{release.artist}</h2>
          <p className="text-base text-fg/75">{release.title}</p>
        </div>
        <ReactionButton release={release} onRequireLogin={onRequireLogin} />
      </div>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {FIELDS.map(([key, label]) => {
          const value = release[key];
          if (!value) return null;
          return (
            <div key={label} className="contents">
              <dt className="text-muted">{label}</dt>
              <dd className="text-fg/90 break-words">{value}</dd>
            </div>
          );
        })}
      </dl>

      {release.notes && (
        <p className="mt-4 text-sm text-fg/80 whitespace-pre-wrap">
          {release.notes}
        </p>
      )}

      {release.source && (
        <a
          href={release.source}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm text-accent underline break-all"
        >
          {hostnameOf(release.source) ?? release.source}
        </a>
      )}
    </main>
  );
}
