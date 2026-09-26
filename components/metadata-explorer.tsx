"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { JsonValue } from "@/components/json-value";
import type { HarnessId, HarnessSample, Outcome } from "@/lib/metadata-explorer";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

/**
 * The interactive metadata explorer.
 *
 * A reader picks a harness, reads the raw native records it writes, and sees the
 * single unified session peasant lowers them into. Selecting a raw record marks
 * the turns it produced and explains, in plain language, where it landed.
 *
 * Scope is raw native records to unified wire only: the storage-entry IR, the
 * outcome registry, and fairtrade's transcript viewer are deliberately absent.
 */

const OUTCOME_LABEL: Record<Outcome, string> = {
  text: "text",
  tool_call: "tool call",
  tool_result: "tool result",
  control: "control",
  ignored: "ignored",
  opaque: "retained unknown",
};

const OUTCOME_GLYPH: Record<Outcome, string> = {
  text: "¶",
  tool_call: "▸",
  tool_result: "◂",
  control: "•",
  ignored: "–",
  opaque: "?",
};

const LEGEND: ReadonlyArray<{ outcome: Outcome; description: string }> = [
  { outcome: "text", description: "reader-visible prose that becomes a turn" },
  { outcome: "tool_call", description: "a tool invocation attached to a turn" },
  { outcome: "tool_result", description: "what the tool returned, attached to its call" },
  { outcome: "control", description: "lifecycle or bookkeeping that writes no turn" },
  { outcome: "ignored", description: "recorded metadata the timeline does not render" },
  { outcome: "opaque", description: "an undeclared kind kept as evidence, not dropped" },
];

/**
 * Why a selected record writes no turn. Each outcome says something different:
 * `opaque` is the only one kept as publishable evidence, while control and
 * ignored records are accounted for without ever blocking completeness.
 */
const NO_TURN_NOTE: Record<Outcome, string> = {
  text: "reader-visible prose, but it lowers no turn of its own",
  tool_call: "a tool invocation that attaches to a turn created elsewhere",
  tool_result: "a tool result that attaches to a call created elsewhere",
  control: "lifecycle or bookkeeping, so it does not block completeness",
  ignored: "recorded metadata the timeline does not render",
  opaque: "an undeclared kind kept as complete redacted evidence, not dropped",
};

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return (
    <span className="mx-outcome" data-outcome={outcome}>
      <span className="mx-outcome-glyph" aria-hidden="true">
        {OUTCOME_GLYPH[outcome]}
      </span>
      {OUTCOME_LABEL[outcome]}
    </span>
  );
}

export function MetadataExplorer({ samples }: { samples: HarnessSample[] }) {
  const first = samples[0];
  const [activeId, setActiveId] = useState<HarnessId>(first?.id ?? "claude-code");
  const [activeRecordId, setActiveRecordId] = useState<string>(
    first?.records[0]?.id ?? "",
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const treeRef = useRef<HTMLDivElement | null>(null);

  /*
   * The unified payload is capped to its own scroll pane, so a freshly selected
   * record has to bring the turn it produced back into view. `block: "nearest"`
   * keeps the page itself still when the pane already shows the turn.
   */
  useEffect(() => {
    const tree = treeRef.current;
    if (!tree) {
      return;
    }
    tree.scrollTop = 0;
    tree
      .querySelector<HTMLElement>('[data-highlighted="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeId, activeRecordId]);

  if (!first) {
    return null;
  }

  const active = samples.find((sample) => sample.id === activeId) ?? first;
  const activeRecord =
    active.records.find((record) => record.id === activeRecordId) ?? active.records[0];
  const { turns: rawTurns, ...session } = active.unified;
  const turns = rawTurns ?? [];
  const mappedTurns = turns.filter((turn) => activeRecord.mapsTo.includes(turn.index));

  const targets: string[] = [];
  for (const turn of mappedTurns) {
    targets.push(`unified turn ${turn.index}`);
    for (const call of turn.toolCalls ?? []) {
      targets.push(`tool call ${call.id}`);
    }
  }

  function selectTab(index: number) {
    const next = samples[index];
    if (!next) {
      return;
    }
    setActiveId(next.id);
    setActiveRecordId(next.records[0]?.id ?? "");
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
              aria-controls="mx-metadata-panel"
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

      <div
        role="tabpanel"
        id="mx-metadata-panel"
        className="mx-panel"
        aria-labelledby={`mx-tab-${active.id}`}
      >
        <div className="mx-grid">
          <div className="mx-col mx-native">
            <h3>native records</h3>
            <p className="mx-native-intro">{active.intro}</p>
            <dl className="mx-native-meta">
              <div>
                <dt>path</dt>
                <dd>
                  <code data-native-path>{active.native.path}</code>
                </dd>
              </div>
              <div>
                <dt>format</dt>
                <dd>{active.native.format}</dd>
              </div>
            </dl>
            <p className="mx-native-note">{active.native.note}</p>
            <ul className="mx-records">
              {active.records.map((record) => {
                const selected = record.id === activeRecord.id;
                return (
                  <li key={record.id}>
                    <button
                      type="button"
                      className="mx-record"
                      data-record-id={record.id}
                      data-outcome={record.outcome}
                      aria-pressed={selected}
                      onClick={() => setActiveRecordId(record.id)}
                    >
                      <span className="mx-record-head">
                        <code className="mx-record-kind">{record.kind}</code>
                        <OutcomeBadge outcome={record.outcome} />
                      </span>
                      <span className="mx-record-note">{record.note}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mx-col mx-unified">
            <h3>unified session</h3>
            <dl className="mx-summary">
              <div>
                <dt>harness</dt>
                <dd>{active.id}</dd>
              </div>
              <div>
                <dt>model</dt>
                <dd>{active.unified.model}</dd>
              </div>
              <div>
                <dt>outcome</dt>
                <dd>{active.unified.outcome}</dd>
              </div>
              <div>
                <dt>duration</dt>
                <dd className="mx-tnum">{active.unified.durationMins} min</dd>
              </div>
              <div>
                <dt>turns</dt>
                <dd className="mx-tnum">{active.unified.turnCount}</dd>
              </div>
              <div>
                <dt>tool calls</dt>
                <dd className="mx-tnum">{active.unified.toolCallCount}</dd>
              </div>
            </dl>
            <div
              className="mx-unified-tree"
              data-unified-tree
              ref={treeRef}
              role="group"
              aria-label="unified session payload"
              tabIndex={0}
            >
              <JsonValue value={session} name="session" />
              <div className="mx-json mx-json-array">
                <span className="mx-json-key">turns</span>
                <span className="mx-json-punct">[</span>
                <div className="mx-json-children">
                  {turns.map((turn) => {
                    const highlighted = activeRecord.mapsTo.includes(turn.index);
                    return (
                      <div className="mx-json-row" key={turn.index}>
                        <div
                          className="mx-turn"
                          data-turn-index={turn.index}
                          data-highlighted={highlighted ? "true" : undefined}
                        >
                          {highlighted ? (
                            <span className="mx-turn-link">from {activeRecord.kind}</span>
                          ) : null}
                          <JsonValue value={turn} name={String(turn.index)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <span className="mx-json-punct">]</span>
              </div>
            </div>
          </div>

          <div className="mx-col mx-annotation" data-mx-annotation>
            <h3>selected record</h3>
            <div className="mx-annotation-head">
              <code className="mx-record-kind">{activeRecord.kind}</code>
              <OutcomeBadge outcome={activeRecord.outcome} />
            </div>
            <p className="mx-annotation-note">{activeRecord.note}</p>
            {targets.length > 0 ? (
              <p className="mx-annotation-targets">
                lowers to {targets.join(", ")}.
              </p>
            ) : (
              <p className="mx-annotation-targets" data-no-turn>
                this record writes no unified turn. it is{" "}
                {OUTCOME_LABEL[activeRecord.outcome]}: {NO_TURN_NOTE[activeRecord.outcome]}.
              </p>
            )}
            <JsonValue value={activeRecord.raw} name="raw" />
          </div>
        </div>
      </div>

      <dl className="mx-legend" aria-label="record outcomes">
        {LEGEND.map((entry) => (
          <div key={entry.outcome}>
            <dt>
              <span className="mx-outcome-glyph" aria-hidden="true">
                {OUTCOME_GLYPH[entry.outcome]}
              </span>
              {OUTCOME_LABEL[entry.outcome]}
            </dt>
            <dd>{entry.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
