"use client";

import { BrandMark } from "@/components/fairtrade-client";
import type { FieldGroup, HarnessId, HarnessSample } from "@/lib/metadata-explorer";
import type { RenderedSamples, RenderedView, ShikiToken } from "@/lib/schema-render";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

/*
 * Measure before paint on the client and never on the server, so the shared
 * column height is right on the first paint without a server-render warning.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The schema explorer.
 *
 * A reader picks a harness, toggles between its native metadata file and the
 * unified wire session, reads the document as highlighted json, and follows a
 * field group from an annotation section into the lines it covers.
 *
 * Scope is raw native records to unified wire only: the storage-entry IR, the
 * outcome registry, and fairtrade's transcript viewer are deliberately absent.
 */

const VIEWS = ["native", "unified"] as const;
type ViewId = (typeof VIEWS)[number];

const VIEW_LABEL: Record<ViewId, string> = {
  native: "native metadata",
  unified: "unified session",
};

function viewOf(sample: HarnessSample, id: ViewId): HarnessSample["native"] {
  return id === "unified" ? sample.unified : sample.native;
}

/** Each token carries its fairtrade-token colour from the shiki theme. */
function tokenStyle(token: ShikiToken): CSSProperties {
  return token.color ? { color: token.color } : {};
}

function Section({
  group,
  active,
  onSelect,
}: {
  group: FieldGroup;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const fieldsId = `mx-fields-${group.id}`;

  return (
    <div
      className="mx-section"
      data-section={group.id}
      data-accent={group.accent}
      data-active={active ? "true" : undefined}
    >
      <button
        type="button"
        className="mx-section-head"
        aria-expanded={active}
        aria-controls={fieldsId}
        onClick={() => onSelect(group.id)}
        onFocus={() => onSelect(group.id)}
      >
        <span className="mx-section-head-text">
          <span className="mx-section-title">{group.title}</span>
          <span className="mx-section-summary">{group.summary}</span>
        </span>
        {active ? <span className="mx-section-selected">selected</span> : null}
        <span className="mx-section-chevron" aria-hidden="true">
          {active ? "▾" : "▸"}
        </span>
      </button>
      <dl className="mx-section-fields" id={fieldsId} hidden={!active}>
        {group.fields.map((field) => (
          <div className="mx-field" key={field.key}>
            <dt className="mx-field-key">{field.key}</dt>
            <dd className="mx-field-note">{field.note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function HighlightedJson({
  rendered,
  activeGroupId,
  onActivate,
}: {
  rendered: RenderedView;
  activeGroupId: string;
  onActivate: (id: string) => void;
}) {
  return (
    <pre className="mx-json-pre">
      <code>
        {rendered.lines.map((line, index) => {
          const groups = line.groups;
          const active = activeGroupId !== "" && groups.includes(activeGroupId);
          const tokens = line.tokens;
          return (
            <span
              key={index}
              className="mx-json-line"
              data-line={index}
              data-groups={groups.length > 0 ? groups.join(" ") : undefined}
              data-active={active ? "true" : undefined}
              onClick={groups.length > 0 ? () => onActivate(groups[0]) : undefined}
            >
              {tokens.length > 0
                ? tokens.map((token, tokenIndex) => (
                    <span key={tokenIndex} style={tokenStyle(token)}>
                      {token.content}
                    </span>
                  ))
                : "\u00A0"}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

export function MetadataExplorer({
  samples,
  rendered,
}: {
  samples: HarnessSample[];
  rendered: RenderedSamples;
}) {
  const first = samples[0];
  const [harnessId, setHarnessId] = useState<HarnessId>(first?.id ?? "claude-code");
  const [viewId, setViewId] = useState<ViewId>("native");
  const [activeGroupId, setActiveGroupId] = useState<string>(
    first?.native.groups[0]?.id ?? "",
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const sectionsRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollRef = useRef(false);
  const [panelHeight, setPanelHeight] = useState(0);

  const active = samples.find((sample) => sample.id === harnessId) ?? first;
  const view = active ? viewOf(active, viewId) : undefined;
  const viewRender = active ? rendered[active.id]?.[viewId] : undefined;
  const groups = view?.groups ?? [];
  const activeAccent = groups.find((group) => group.id === activeGroupId)?.accent;

  // Selecting from a section header scrolls the group's first line into view.
  // Selecting by clicking a region does not move the pane, and hover never
  // selects at all, so scanning the document stays quiet.
  useEffect(() => {
    if (!pendingScrollRef.current) {
      return;
    }
    pendingScrollRef.current = false;
    const pane = paneRef.current;
    if (!pane || !viewRender || activeGroupId === "") {
      return;
    }
    const line = viewRender.groupFirstLine[activeGroupId];
    if (line === undefined) {
      return;
    }
    pane
      .querySelector<HTMLElement>(`[data-line="${line}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeGroupId, viewRender]);

  // The two columns share one height, and it must not move when a section opens
  // or closes. The annotation column decides that height: measure it with each
  // section open in turn and keep the tallest, so the document pane is as tall
  // as the largest section and stays put while the reader switches between them.
  useIsomorphicLayoutEffect(() => {
    const sections = sectionsRef.current;
    if (!sections) {
      return;
    }
    const measure = () => {
      const lists = Array.from(
        sections.querySelectorAll<HTMLElement>(".mx-section-fields"),
      );
      const items = Array.from(sections.querySelectorAll<HTMLElement>(".mx-section"));
      if (lists.length === 0 || items.length === 0) {
        setPanelHeight(0);
        return;
      }
      const gap = Number.parseFloat(getComputedStyle(sections).rowGap) || 0;
      const wasHidden = lists.map((list) => list.hidden);
      let tallest = 0;
      for (let open = 0; open < lists.length; open += 1) {
        lists.forEach((list, index) => {
          list.hidden = index !== open;
        });
        // The open section shows a "selected" marker, which narrows its head and
        // can wrap a summary to another line. Show it while measuring too, so
        // the height is the one the reader actually gets.
        const head = items[open]?.querySelector<HTMLElement>(".mx-section-head");
        let marker: HTMLElement | null = null;
        if (head && !head.querySelector(".mx-section-selected")) {
          marker = document.createElement("span");
          marker.className = "mx-section-selected";
          marker.textContent = "selected";
          head.appendChild(marker);
        }
        const height =
          items.reduce((sum, item) => sum + item.getBoundingClientRect().height, 0) +
          gap * (items.length - 1);
        marker?.remove();
        tallest = Math.max(tallest, height);
      }
      lists.forEach((list, index) => {
        list.hidden = wasHidden[index];
      });
      setPanelHeight(Math.ceil(tallest));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active.id, viewId]);

  function selectGroupFromSection(id: string) {
    pendingScrollRef.current = true;
    setActiveGroupId(id);
  }

  if (!first || !active || !view || !viewRender) {
    return null;
  }

  function selectTab(index: number) {
    const next = samples[index];
    if (!next) {
      return;
    }
    setHarnessId(next.id);
    setActiveGroupId(viewOf(next, viewId).groups[0]?.id ?? "");
    paneRef.current?.scrollTo({ top: 0 });
  }

  function selectViewId(id: ViewId) {
    if (id === viewId) {
      return;
    }
    setViewId(id);
    setActiveGroupId(viewOf(active, id).groups[0]?.id ?? "");
    paneRef.current?.scrollTo({ top: 0 });
  }

  function onTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % samples.length;
        break;
      case "ArrowLeft":
        next = (index - 1 + samples.length) % samples.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = samples.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectTab(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="mx" data-metadata-explorer>
      <div className="mx-tabs" role="tablist" aria-label="harness">
        {samples.map((sample, index) => {
          const selected = sample.id === active.id;
          return (
            <button
              key={sample.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`mx-tab-${sample.id}`}
              className="mx-tab"
              data-harness={sample.id}
              aria-selected={selected}
              aria-controls="mx-schema-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(index)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {sample.brand ? <BrandMark name={sample.brand} /> : null}
              <span className="mx-tab-label">{sample.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-view" role="group" aria-label="schema view">
        {VIEWS.map((id) => {
          const pressed = viewId === id;
          return (
            <button
              key={id}
              type="button"
              className="mx-view-option"
              data-view={id}
              aria-pressed={pressed}
              onClick={() => selectViewId(id)}
            >
              {VIEW_LABEL[id]}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="mx-schema-panel"
        className="mx-panel"
        aria-labelledby={`mx-tab-${active.id}`}
      >
        <p className="mx-intro">{active.intro}</p>

        <div
          className="mx-grid"
          style={
            panelHeight > 0
              ? ({ "--mx-row-h": `${panelHeight}px` } as CSSProperties)
              : undefined
          }
        >
          <div className="mx-json-column">
            <div className="pj-terminal mx-terminal">
              <div className="pj-terminal-head">
                <p className="pj-terminal-name">
                  <span className="pj-terminal-dot" aria-hidden="true" />
                  <span data-schema-filename>{view.filename}</span>
                </p>
              </div>
              <div
                className="mx-json-pane"
                data-json-pane
                data-accent={activeAccent}
                ref={paneRef}
                role="group"
                aria-label={`${view.label} document`}
                tabIndex={0}
              >
                <HighlightedJson
                  rendered={viewRender}
                  activeGroupId={activeGroupId}
                  onActivate={setActiveGroupId}
                />
              </div>
            </div>
          </div>

          <div className="mx-sections" data-schema-sections ref={sectionsRef}>
            {groups.map((group) => (
              <Section
                key={`${active.id}-${view.id}-${group.id}`}
                group={group}
                active={group.id === activeGroupId}
                onSelect={selectGroupFromSection}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
