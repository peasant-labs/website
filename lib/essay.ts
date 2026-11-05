import type { TocItem } from "@/lib/docs-content";

/*
 * A post written as data rather than as its own component: running text,
 * headings, nested lists, figures and numbered notes. Its strings use the docs'
 * marks (`code`, **strong**, [label](href)) plus three of an essay's own:
 * *emphasis*, [^n] for a reference to note n, and \[ \] for a bracket the
 * author wrote. components/blog/essay.tsx draws it; the helpers here derive the
 * words the docs search indexes and the "on this page" list, so neither can
 * drift from the page.
 */
export type EssayList = Readonly<{ ordered: boolean; items: readonly EssayItem[] }>;
export type EssayItem = Readonly<{ text: readonly string[]; list?: EssayList }>;

export type EssayBlock =
  | Readonly<{ kind: "h2" | "h3"; id: string; text: string }>
  | Readonly<{ kind: "p"; text: string }>
  | Readonly<{ kind: "list" } & EssayList>
  | Readonly<{ kind: "figure"; src: string; alt: string; width: number; height: number; caption?: string }>;

export type Essay = Readonly<{
  blocks: readonly EssayBlock[];
  /* numbered from 1 in order; each is one or more paragraphs */
  notes: readonly Readonly<{ n: number; text: readonly string[] }>[];
}>;

/* the heading over an essay's notes, and its id */
export const NOTES = { id: "notes", title: "notes" } as const;

/** the id of note n, and of the place in the text that points to it */
export const noteId = (n: number) => `note-${n}`;
export const noteRefId = (n: number) => `note-ref-${n}`;

/** an essay's marks removed, except the docs' own, which the search strips itself */
function words(text: string): string {
  return text
    .replace(/\[\^\d+\]/g, "")
    .replace(/\\([[\]])/g, "$1")
    .replace(/(?<![*\w])\*(?![*\s])([^*]+?)(?<![*\s])\*(?![*\w])/g, "$1");
}

function listWords(list: EssayList): string[] {
  return list.items.flatMap((item) => [...item.text.map(words), ...(item.list ? listWords(item.list) : [])]);
}

/** every line the essay shows, in reading order, for the docs search */
export function essayText(essay: Essay): string[] {
  const lines = essay.blocks.flatMap((block): string[] => {
    switch (block.kind) {
      case "h2":
      case "h3":
      case "p":
        return [words(block.text)];
      case "list":
        return listWords(block);
      case "figure":
        return block.caption ? [words(block.caption)] : [];
    }
  });
  if (essay.notes.length === 0) return lines;
  return [...lines, NOTES.title, ...essay.notes.flatMap((note) => note.text.map(words))];
}

/** the essay's "on this page": each h2, each h3 under it, then its notes */
export function essayToc(essay: Essay): TocItem[] {
  const items: TocItem[] = essay.blocks.flatMap((block) => {
    if (block.kind === "h2") return [{ id: block.id, label: words(block.text) }];
    if (block.kind === "h3") return [{ id: block.id, label: words(block.text), sub: true }];
    return [];
  });
  return essay.notes.length > 0 ? [...items, { id: NOTES.id, label: NOTES.title }] : items;
}
