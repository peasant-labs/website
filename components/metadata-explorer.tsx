"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { JsonValue } from "@/components/json-value";
import type {
  FieldGroup,
  HarnessId,
  HarnessSample,
  SchemaView,
} from "@/lib/metadata-explorer";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

/**
 * The schema explorer.
 *
 * A reader picks a harness, toggles between its native metadata file and the
 * unified wire session, reads the document as ordinary JSON, and follows a
 * field group from an annotation section into the highlighted region it covers.
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

function selectView(sample: HarnessSample, id: ViewId): SchemaView {
  return id === "unified" ? sample.unified : sample.native;
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

export function MetadataExplorer({ samples }: { samples: HarnessSample[] }) {
  const first = samples[0];
  const [harnessId, setHarnessId] = useState<HarnessId>(first?.id ?? "claude-code");
  const [viewId, setViewId] = useState<ViewId>("native");
  const [activeGroupId, setActiveGroupId] = useState<string>(
    first?.native.groups[0]?.id ?? "",
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollRef = useRef(false);

  const active = samples.find((sample) => sample.id === harnessId) ?? first;
  const view = active ? selectView(active, viewId) : undefined;

  // A section header click or focus brings its JSON region into view; hovering a
  // region only highlights it, so the reader can scan without the pane jumping.
  useEffect(() => {
    if (!pendingScrollRef.current) {
      return;
    }
    pendingScrollRef.current = false;
    const pane = paneRef.current;
    if (!pane || activeGroupId === "") {
      return;
    }
    pane
      .querySelector<HTMLElement>(`[data-region~="${activeGroupId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeGroupId]);

  function selectGroupFromSection(id: string) {
    pendingScrollRef.current = true;
    setActiveGroupId(id);
  }

  if (!first || !active || !view) {
    return null;
  }

  function selectTab(index: number) {
    const next = samples[index];
    if (!next) {
      return;
    }
    setHarnessId(next.id);
    // The first group of the active view is selected by default, matching the
    // reference's "first region highlighted" state.
    setActiveGroupId(selectView(next, viewId).groups[0]?.id ?? "");
  }

  function selectViewId(id: ViewId) {
    if (id === viewId) {
      return;
    }
    setViewId(id);
    setActiveGroupId(selectView(active, id).groups[0]?.id ?? "");
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

        <div className="mx-grid">
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
                ref={paneRef}
                role="group"
                aria-label={`${view.label} document`}
                tabIndex={0}
              >
                <JsonValue
                  value={view.document}
                  path={[]}
                  groups={view.groups}
                  activeGroup={activeGroupId}
                  onActivate={setActiveGroupId}
                />
              </div>
            </div>
          </div>

          <div className="mx-sections" data-schema-sections>
            {view.groups.map((group) => (
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
