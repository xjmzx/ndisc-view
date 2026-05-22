import { CoverArt } from "./CoverArt";
import { hostnameOf, type Release } from "../lib/nostr";

interface Props {
  release: Release;
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

// Detail body for one release. The app header (permanent bar + back button)
// is owned by App; this renders only the scrolling content beneath it.
export function ReleaseDetail({ release }: Props) {
  return (
    <main className="flex-1 px-4 py-4">
      <CoverArt
        src={release.image}
        alt={release.title}
        className="w-full aspect-square rounded-xl mb-4"
      />

      <h2 className="text-lg font-bold leading-tight">{release.artist}</h2>
      <p className="text-base text-fg/75 mb-4">{release.title}</p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
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
