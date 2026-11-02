export type Positioning = "family" | "technology" | "value";
export type TargetFamily = "all" | "growing" | "upgrade" | "commuter";
export type SalesPlay = "balanced" | "new-model" | "portfolio-test-drive";
export type PurchaseType = "首购" | "增购" | "换购";

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
export type MovementKind = "真正新增" | "内部蚕食" | "竞品抢夺" | "延迟释放" | "保持" | "流失";

export type SimulationFamily = {
  id: string; name: string; segment: Exclude<TargetFamily, "all">; purchaseType: PurchaseType; weight: number;
  budgetCenter: number; priceSensitivity: number; familyFit: number; technologyFit: number;
  urgency: number; baselineChoice: string; baselineKind: ChoiceKind; existingOwnChoice: string;
};

export type FamilyResult = {
  family: SimulationFamily; baselineChoice: string; baselineKind: ChoiceKind;
  experimentChoice: string; experimentKind: ChoiceKind; reason: string; confidence: number;
  unitDelta: number; profitDelta: number; movement: MovementKind;
  contribution: { sales: number; profit: number; coverage: number };
};

export type VehicleStructure = {
  vehicle: string; kind: "新车型" | "现有车型"; sales: number; share: number; revenue: number; profit: number;
};
export type PurchaseStructure = { type: PurchaseType; sales: number; share: number };
export type MigrationFlow = {
  from: string; to: string; movement: MovementKind; households: number; share: number;
};
export type ConfidenceSummary = {
  level: "中" | "中高" | "高"; score: number; sampleCoverage: number; sensitivityRisk: string; boundary: string;
};

export type SimulationMetrics = {
  sales: number; salesDelta: number; revenue: number; revenueDelta: number; profit: number; profitDelta: number;
  trueIncremental: number; cannibalization: number; competitorCapture: number;
  delayedRelease: number; retained: number; lost: number; familyCoverage: number; coverageDelta: number;
  benefitCost: number; roi: number;
};

export type SimulationResult = {
  baseline: SimulationMetrics;
  experiment: SimulationMetrics;
  families: FamilyResult[];
  vehicleStructure: VehicleStructure[];
  purchaseStructure: PurchaseStructure[];
  migrationFlows: MigrationFlow[];
  confidence: ConfidenceSummary;
};
