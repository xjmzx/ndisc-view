import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  name: string;
  index: number;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}

// Width of the soft fade applied at a scrollable edge.
const EDGE = "18px";

// One facet as a horizontally-scrolling row of toggle chips. `name` is the
// screen-reader label only. Craft: a soft fade-mask hints at off-screen
// chips, chips spring on toggle, and the row fades in (staggered by index).
export function FilterRow({ name, index, options, selected, onToggle }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  // Fade only the edges that actually have more chips beyond them.
  const updateFade = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateFade();
    window.addEventListener("resize", updateFade);
    return () => window.removeEventListener("resize", updateFade);
  }, [updateFade, options]);

  if (options.length === 0) return null;

  const maskImage =
    fade.left && fade.right
      ? `linear-gradient(to right, transparent, #000 ${EDGE}, #000 calc(100% - ${EDGE}), transparent)`
      : fade.right
        ? `linear-gradient(to right, #000 calc(100% - ${EDGE}), transparent)`
        : fade.left
          ? `linear-gradient(to right, transparent, #000 ${EDGE})`
          : undefined;

  return (
    <div
      ref={scrollerRef}
      role="group"
      aria-label={`filter by ${name}`}
      onScroll={updateFade}
      style={{
        animationDelay: `${index * 70}ms`,
        maskImage,
        WebkitMaskImage: maskImage,
      }}
      className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]
                 [&::-webkit-scrollbar]:hidden
                 animate-[fade-in-up_240ms_ease-out_both]"
    >
      {options.map((value) => {
        const on = selected.has(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            aria-pressed={on}
            // Springy easing — overshoots slightly so a toggle "pops".
            style={{
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            className={
              "shrink-0 px-2.5 py-1 rounded-full text-xs whitespace-nowrap " +
              "transition-[transform,background-color,color] duration-200 " +
              "active:scale-95 " +
              (on
                ? "bg-accent text-bg font-medium scale-105"
                : "bg-surface text-fg/70 scale-100")
            }
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}
