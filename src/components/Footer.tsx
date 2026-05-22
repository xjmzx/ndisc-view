import { DEFAULT_RELAYS, OWNER_NPUB } from "../config";

// Mirrors the desktop ndisc footer (stack line / identity / data source),
// adapted to the viewer: it has no DB or keychain, so "identity" becomes the
// owner npub being viewed and "data source" becomes the relay set. Stacked
// vertically for the narrow mobile width.
const relayHosts = DEFAULT_RELAYS.map((r) =>
  r.replace(/^wss?:\/\//, ""),
).join(" · ");

const ownerShort = `${OWNER_NPUB.slice(0, 12)}…${OWNER_NPUB.slice(-6)}`;

export function Footer() {
  return (
    <footer
      className="mt-8 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]
                 flex flex-col gap-0.5 text-[11px] text-muted"
    >
      <span>ndisc-mobile · React + Vite + Tailwind + Capacitor</span>
      <span className="font-mono truncate">viewing {ownerShort}</span>
      <span className="break-all">relays · {relayHosts}</span>
    </footer>
  );
}
