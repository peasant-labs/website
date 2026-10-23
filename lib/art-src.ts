/*
 * Each picture in public/art keeps its name when it is redrawn, and /art is
 * cached for hours, so a redraw would wait out the cache before anyone saw it.
 * next.config.ts hashes every file there at build and inlines the map; a
 * picture's address carries its content's hash, so a new drawing is a new
 * address the moment it ships.
 */
const VERSIONS: Readonly<Record<string, string>> = JSON.parse(process.env.NEXT_PUBLIC_ART_VERSIONS ?? "{}");

/** "/art/uc-book-light.png" → "/art/uc-book-light.png?v=1a2b3c4d" (unchanged when the file is unknown) */
export function artSrc(path: string): string {
  const version = VERSIONS[path.replace(/^\/art\//, "")];
  return version ? `${path}?v=${version}` : path;
}
