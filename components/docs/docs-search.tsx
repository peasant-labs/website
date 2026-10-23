"use client";

import type { SearchDoc, SearchIndex } from "@/lib/docs-search";
import { FileText, Hash, Search, SearchX, X } from "@peasant-labs/fairtrade/icons";
import type MiniSearch from "minisearch";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * Full-text search over the docs and the blog. The index is one static JSON
 * file built from the pages' own content (lib/docs-search.ts); it and the
 * search engine load the first time search opens. ⌘K, Ctrl+K or "/" opens it,
 * as does "search" in the sidebar. It draws fairtrade's command palette: a
 * centred panel on a wide screen, a full-screen sheet on a phone.
 */

type Hit = Readonly<{ doc: SearchDoc; score: number }>;
type Segment = Readonly<{ text: string; mark: boolean }>;

const MAX_HITS = 20;
const SNIPPET = 150;

let indexLoad: Promise<{ engine: MiniSearch<SearchDoc>; docs: readonly SearchDoc[] }> | null = null;

/* the index and the engine, fetched once per page load and shared by every open */
function loadIndex() {
  indexLoad ??= Promise.all([fetch("/docs/search-index.json"), import("minisearch")]).then(
    async ([response, { default: Engine }]) => {
      if (!response.ok) throw new Error(`search index: ${response.status}`);
      const index = (await response.json()) as SearchIndex;
      const engine = new Engine<SearchDoc>({
        fields: ["page", "heading", "text"],
        storeFields: ["id", "page", "heading", "text", "href"],
        searchOptions: {
          // a page title outranks a section heading, which outranks the words under it
          boost: { page: 4, heading: 3, text: 1 },
          prefix: true,
          fuzzy: (term) => (term.length > 4 ? 0.2 : false),
          combineWith: "AND",
        },
      });
      engine.addAll(index.docs);
      return { engine, docs: index.docs };
    },
  );
  indexLoad.catch(() => {
    indexLoad = null;
  });
  return indexLoad;
}

function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

const escapeRegExp = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** the text split into plain and matched runs, where a term starts a word */
function marked(text: string, words: string[]): Segment[] {
  if (words.length === 0) return [{ text, mark: false }];
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${words.map(escapeRegExp).join("|")})`, "giu");
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) segments.push({ text: text.slice(last, at), mark: false });
    segments.push({ text: match[0], mark: true });
    last = at + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), mark: false });
  return segments;
}

/** about one line and a half of the section's words, around the first match */
function snippet(text: string, words: string[]): Segment[] {
  const lower = text.toLowerCase();
  let at = -1;
  for (const word of words) {
    const found = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}`, "u").exec(lower);
    if (found && (at < 0 || found.index < at)) at = found.index;
  }
  let start = at < 0 ? 0 : Math.max(0, at - 40);
  if (start > 0) start = text.indexOf(" ", start) + 1 || start;
  let end = Math.min(text.length, start + SNIPPET);
  if (end < text.length) end = text.lastIndexOf(" ", end) > start ? text.lastIndexOf(" ", end) : end;
  const piece = `${start > 0 ? "… " : ""}${text.slice(start, end)}${end < text.length ? " …" : ""}`;
  return marked(piece, words);
}

/** hits grouped by page, pages in the order of their best hit */
function grouped(hits: readonly Hit[]) {
  const groups = new Map<string, Hit[]>();
  for (const hit of hits) {
    const list = groups.get(hit.doc.page) ?? [];
    list.push(hit);
    groups.set(hit.doc.page, list);
  }
  return [...groups.entries()].map(([page, list]) => ({ page, hits: list }));
}

type SearchContext = Readonly<{ open: () => void }>;

const Context = createContext<SearchContext>({ open: () => {} });

export function useDocsSearch() {
  return useContext(Context);
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName);
}

export function DocsSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, []);

  const close = useCallback((restore: boolean) => {
    setOpen(false);
    if (restore) {
      // the drawer that held the trigger may be gone; then focus the page instead
      const target = returnFocus.current?.isConnected ? returnFocus.current : document.getElementById("content");
      requestAnimationFrame(() => target?.focus());
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const combo = (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k";
      const slash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target);
      if (combo || slash) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <Context.Provider value={value}>
      {children}
      {isOpen ? <SearchDialog onClose={close} /> : null}
    </Context.Provider>
  );
}

function SearchDialog({ onClose }: { onClose: (restore: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [engine, setEngine] = useState<{ engine: MiniSearch<SearchDoc>; docs: readonly SearchDoc[] } | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const listId = `${uid}-results`;
  const titleId = `${uid}-title`;

  useEffect(() => {
    let live = true;
    loadIndex().then(
      (loaded) => {
        if (!live) return;
        setEngine(loaded);
        setState("ready");
      },
      () => live && setState("failed"),
    );
    inputRef.current?.focus();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      live = false;
      root.style.overflow = overflow;
    };
  }, []);

  const words = useMemo(() => terms(query), [query]);

  const hits = useMemo<Hit[]>(() => {
    if (!engine) return [];
    if (words.length === 0) {
      // nothing typed yet: the pages themselves
      return engine.docs.filter((doc) => !doc.href.includes("#")).map((doc) => ({ doc, score: 0 }));
    }
    return engine.engine
      .search(query)
      .slice(0, MAX_HITS)
      .map((result) => ({ doc: result as unknown as SearchDoc, score: result.score }));
  }, [engine, query, words.length]);

  // nothing typed yet: one list of the pages; otherwise the hits under their page. Each hit
  // carries its place in the whole list, which the arrow keys move through.
  const groups = useMemo(() => {
    let at = 0;
    return (words.length === 0 ? [{ page: "pages", hits }] : grouped(hits)).map((group) => ({
      ...group,
      hits: group.hits.map((hit) => ({ ...hit, at: at++ })),
    }));
  }, [hits, words.length]);
  const flat = useMemo(() => groups.flatMap((group) => group.hits), [groups]);
  const current = Math.min(active, Math.max(0, flat.length - 1));

  const go = (doc: SearchDoc) => {
    onClose(false);
    const url = new URL(doc.href, window.location.href);
    if (url.pathname === window.location.pathname && url.hash) {
      window.history.pushState(null, "", url.hash);
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      target?.scrollIntoView({ block: "start" });
      return;
    }
    router.push(doc.href);
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(flat.length - 1, Math.min(index, flat.length - 1) + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, Math.min(index, flat.length - 1) - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = flat[current];
      if (hit) go(hit.doc);
    } else if (event.key === "Tab") {
      // keep focus inside the dialog
      const focusable = [...(panelRef.current?.querySelectorAll<HTMLElement>("input, button") ?? [])].filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length < 2) {
        event.preventDefault();
        return;
      }
      const at = focusable.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (at <= 0 ? focusable.length - 1 : at - 1) : (at + 1) % focusable.length;
      event.preventDefault();
      focusable[next]!.focus();
    }
  };

  useEffect(() => {
    document.getElementById(`${uid}-opt-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [current, uid]);

  return createPortal(
    <div className="cmdk dx-search" onKeyDown={onKeyDown}>
      <div className="cp-scrim" onMouseDown={() => onClose(true)} />
      <div ref={panelRef} className="cp-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="dx-search-title">
          search the docs and blog
        </h2>
        <div className="cp-search">
          <Search aria-hidden="true" focusable="false" />
          <input
            ref={inputRef}
            className="cp-input"
            type="text"
            enterKeyHint="search"
            placeholder="search the docs and blog"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls={flat.length > 0 ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={flat[current] ? `${uid}-opt-${current}` : undefined}
            aria-labelledby={titleId}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="kbd dx-search-esc">esc</span>
          <button type="button" className="dx-search-close" onClick={() => onClose(true)}>
            <X aria-hidden="true" focusable="false" />
            close
          </button>
        </div>
        <div className="cp-results">
          {state === "loading" ? <p className="dx-search-status">loading the index</p> : null}
          {state === "failed" ? (
            <p className="dx-search-status" role="alert">
              Search could not load. Check your connection and open it again.
            </p>
          ) : null}
          {state === "ready" && flat.length === 0 ? (
            <div className="cp-empty">
              <SearchX aria-hidden="true" focusable="false" />
              <p className="cp-empty-t">
                no results for <q>{query}</q>
              </p>
              <p className="cp-empty-d">try a command, like kickstart, or a word from a heading</p>
            </div>
          ) : null}
          {flat.length > 0 ? (
            <div id={listId} role="listbox" aria-label="results">
              {groups.map((group, groupIndex) => (
                <div key={group.page} role="group" aria-labelledby={`${uid}-g-${groupIndex}`}>
                  <div id={`${uid}-g-${groupIndex}`} className="cp-group" role="presentation">
                    {group.page}
                  </div>
                  {group.hits.map((hit) => {
                    const { at } = hit;
                    const section = hit.doc.heading.split(" · ")[0];
                    const page = !hit.doc.href.includes("#");
                    return (
                      <div
                        key={hit.doc.id}
                        id={`${uid}-opt-${at}`}
                        className="cp-row dx-hit"
                        role="option"
                        aria-selected={at === current}
                        onMouseMove={() => setActive(at)}
                        onClick={() => go(hit.doc)}
                      >
                        <span className="cp-mark" aria-hidden="true">
                          {at === current ? ">" : ""}
                        </span>
                        {page ? (
                          <FileText aria-hidden="true" focusable="false" />
                        ) : (
                          <Hash aria-hidden="true" focusable="false" />
                        )}
                        <span className="dx-hit-text">
                          <span className="dx-hit-title">
                            {marked(section, words).map((segment, key) =>
                              segment.mark ? <mark key={key}>{segment.text}</mark> : segment.text,
                            )}
                          </span>
                          {hit.doc.text ? (
                            <span className="dx-hit-snip">
                              {snippet(hit.doc.text, words).map((segment, key) =>
                                segment.mark ? <mark key={key}>{segment.text}</mark> : segment.text,
                              )}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="cp-foot">
          <span className="cp-count" aria-live="polite">
            {state === "ready" && words.length > 0 ? `${flat.length} result${flat.length === 1 ? "" : "s"}` : ""}
          </span>
          <span className="cp-keys">
            <span>
              <span className="kbd">↑</span>
              <span className="kbd">↓</span> move
            </span>
            <span>
              <span className="kbd">↵</span> open
            </span>
            <span>
              <span className="kbd">esc</span> close
            </span>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
