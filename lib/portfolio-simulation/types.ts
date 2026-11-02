export type Positioning = "family" | "technology" | "value";
export type TargetFamily = "all" | "growing" | "upgrade" | "commuter";
export type SalesPlay = "balanced" | "new-model" | "portfolio-test-drive";

export type Strategy = {
  launchEnabled: boolean;
  positioning: Positioning;
  price: number;
  benefit: number;
  targetFamily: TargetFamily;
  salesPlay: SalesPlay;
  deliveryWeeks: number;
};

export type ChoiceKind = "own-new" | "own-existing" | "competitor" | "delay" | "no-purchase";

export type SimulationFamily = {
  id: string; name: string; segment: Exclude<TargetFamily, "all">; weight: number;
  budgetCenter: number; priceSensitivity: number; familyFit: number; technologyFit: number;
  urgency: number; baselineChoice: string; baselineKind: ChoiceKind; existingOwnChoice: string;
};

export type FamilyResult = {
  family: SimulationFamily; baselineChoice: string; baselineKind: ChoiceKind;
  experimentChoice: string; experimentKind: ChoiceKind; reason: string; confidence: number;
  unitDelta: number; profitDelta: number; movement: "真正新增" | "内部蚕食" | "竞品抢夺" | "延迟释放" | "保持/其他";
};

export type SimulationMetrics = {
  sales: number; salesDelta: number; profit: number; profitDelta: number;
  trueIncremental: number; cannibalization: number; competitorCapture: number;
  delayedRelease: number; familyCoverage: number; coverageDelta: number;
};

export type SimulationResult = { baseline: SimulationMetrics; experiment: SimulationMetrics; families: FamilyResult[] };
