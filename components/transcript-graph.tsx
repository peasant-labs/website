"use client";

import { annotateTranscript, detectPhases, type GraphSlotContext, type PhaseType, type TranscriptWireInput } from "@peasant-labs/fairtrade/ui";
import dynamic from "next/dynamic";
import { useMemo } from "react";

// Load the canonical canvas only when a reader opens the graph.
const TrajectoryGraph = dynamic(
  () => import("@peasant-labs/fairtrade/graph").then((module) => module.TrajectoryGraph),
  { ssr: false, loading: () => <p role="status">loading transcript graph…</p> },
);

/** Both website samples use the same graph engine and adapter as the apps. */
export function TranscriptGraph({ session, viewModel }: {
  session: TranscriptWireInput;
  viewModel: GraphSlotContext["viewModel"];
}) {
  const turns = useMemo(() => session.turns ?? [], [session.turns]);
  // The shared detector names wire indices; the canvas accepts display positions.
  const phases = useMemo(() => detectPhases(turns).map((phase) => ({
    type: phase.icon as PhaseType,
    startTurn: turns.findIndex((turn) => turn.index === phase.from),
    endTurn: turns.findIndex((turn) => turn.index === phase.to),
    badges: phase.errors ? [{ type: "error" as const, count: phase.errors }] : [],
  })), [turns]);
  const annotations = useMemo(() => annotateTranscript(turns), [turns]);
  const toolVMsByTurn = useMemo(
    () => new Map(viewModel.turns.map((turn) => [turn.index, turn.toolCalls])),
    [viewModel],
  );

  return (
    <TrajectoryGraph
      turns={turns}
      filteredTurns={turns}
      toolVMsByTurn={toolVMsByTurn}
      phases={phases}
      annotations={annotations}
      searchMatches={[]}
      provider={session.harness}
    />
  );
}
