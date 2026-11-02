import type { Strategy, SimulationResult } from "@/lib/portfolio-simulation";

export type ObjectiveId = "volume" | "profit" | "coverage" | "balanced";
export type MetricId = "sales" | "profit" | "coverage" | "cannibalization" | "capture" | "benefitCost" | "confidence";
export type Plan = { id: string; name: string; tag: string; description: string; strategy: Strategy };
export type Weights = Record<MetricId, number>;
export type MetricValues = Record<MetricId, number>;
export type Contribution = { metric: MetricId; normalized: number; weight: number; points: number };
export type EvaluatedPlan = { plan: Plan; result: SimulationResult; metrics: MetricValues; score: number; contributions: Contribution[] };
export type SensitivityVariable = "price" | "benefit" | "delivery" | "salesPlay" | "positioning";
export type SensitivityRow = { variable: SensitivityVariable; label: string; minusLabel: string; plusLabel: string; salesImpact: [number, number]; profitImpact: [number, number]; scoreImpact: [number, number]; importance: number };
