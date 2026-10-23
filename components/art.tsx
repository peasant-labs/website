import type { Art as ArtSource } from "@/lib/landing";
import Image from "next/image";

/**
 * One illustration, drawn twice: a light and a dark tone. Both images ship and
 * the theme attribute on <html> shows one; the other is `display: none`, so it
 * leaves the accessibility tree and only one alt text is ever read.
 *
 * Both stay `loading="lazy"`, which is what keeps the hidden tone from being
 * fetched at all.
 *
 * The art is dithered pixel work on a transparent ground. It is served as-is
 * (no resampling) and scaled with nearest-neighbour so the dither stays crisp,
 * and it sits straight on the page with no frame.
 */
export function Art({
  art,
  className,
  important = false,
}: {
  art: ArtSource;
  className?: string;
  /** above the fold: fetch early. Never `eager`, which would load both tones. */
  important?: boolean;
}) {
  const common = {
    width: art.width,
    height: art.height,
    unoptimized: true,
    fetchPriority: important ? "high" : undefined,
  } as const;

  return (
    <span className={`art${className ? ` ${className}` : ""}`}>
      <Image {...common} alt={art.alt} src={art.light} className="art-img art-light" />
      <Image {...common} alt={art.alt} src={art.dark} className="art-img art-dark" />
    </span>
  );
}
