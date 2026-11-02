export type ExperimentStatus = "draft" | "running" | "review" | "calibrated";
export type ExperimentMetricId = "testDrive" | "order" | "portfolioSales" | "cannibalization" | "profit";
export type GuardrailId = "complaints" | "contactFrequency" | "benefitCost" | "storeLoad";
export type Metric = { id: ExperimentMetricId; name: string; unit: string; expected: number; actual: number; favorable: "up" | "down" };
export type Guardrail = { id: GuardrailId; name: string; unit: string; threshold: number; actual: number; favorable: "up" | "down" };
export type ExperimentPlan = {
  strategyId: string; strategyName: string; hypothesis: string; audience: string; treatment: string; control: string;
  regions: string[]; period: string; sampleSize: number; variables: string[]; roles: string[]; metrics: Metric[]; guardrails: Guardrail[];
};
export type Attribution = { reason: string; contribution: number; evidence: string };
export type Calibration = { parameter: string; before: string; after: string; reason: string };
