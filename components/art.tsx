import { artSrc } from "@/lib/art-src";
import type { Art as ArtSource } from "@/lib/landing";
import Image from "next/image";

/**
 * One illustration, drawn twice: a light and a dark tone. Both images ship and
 * the theme attribute on <html> shows one; the other is `display: none`, so it
 * leaves the accessibility tree and only one alt text is ever read.
 *
 * Both stay `loading="lazy"`, which is what keeps the hidden tone from being
 * fetched at all, unless the picture is `near`: a picture in a scroll row
 * waits for the row's own view before it loads, so it would pop in as its card
 * moves in. Such a row loads its small pictures, both tones, once it is close.
 *
 * The art is a fine halftone dot screen on a transparent ground, drawn at twice
 * the width and height given here so it stays sharp on high-density screens.
 * It is served as-is (no resampling), scaled smoothly, and sits straight on the
 * page with no frame.
 */
export function Art({
  art,
  className,
  important = false,
  near = false,
}: {
  art: ArtSource;
  className?: string;
  /** above the fold: fetch early. Never `eager`, which would load both tones. */
  important?: boolean;
  /** in a scroll row that is about to show: load now, both tones, rather than as each card scrolls in */
  near?: boolean;
}) {
  const common = {
    width: art.width,
    height: art.height,
    unoptimized: true,
    fetchPriority: important ? "high" : undefined,
    loading: near ? "eager" : "lazy",
  } as const;

  return (
    <span className={`art${className ? ` ${className}` : ""}`}>
      <Image {...common} alt={art.alt} src={artSrc(art.light)} className="art-img art-light" />
      <Image {...common} alt={art.alt} src={artSrc(art.dark)} className="art-img art-dark" />
    </span>
  );
}
