"use client";

import { useMemo } from "react";
import { layoutMap } from "@/lib/flow/layout";
import { computeMetrics, orderedSteps } from "@/lib/flow/metrics";
import type { Lane, MapVersion, Step, VersionKind } from "@/lib/flow/schema";
import { useFlowShell } from "../FlowWorkspace";
import { useMap } from "../MapProvider";

export function useVersion(kindOverride?: VersionKind) {
  const { map } = useMap();
  const shell = useFlowShell();
  const kind: VersionKind = kindOverride ?? shell.version;
  const version: MapVersion = kind === "future" && map.versions.future ? map.versions.future : map.versions.current;
  const lanes = useMemo<Lane[]>(() => [...map.lanes].sort((a, b) => a.order - b.order), [map.lanes]);
  const steps = useMemo<Step[]>(() => orderedSteps(version), [version]);
  const metrics = useMemo(() => computeMetrics(version, map.lanes), [version, map.lanes]);
  const layout = useMemo(() => layoutMap(version, map.lanes, map.unit), [version, map.lanes, map.unit]);
  const laneById = useMemo(() => new Map(lanes.map((l, i) => [l.id, { lane: l, index: i }])), [lanes]);
  return { map, kind, version, lanes, steps, metrics, layout, laneById };
}
