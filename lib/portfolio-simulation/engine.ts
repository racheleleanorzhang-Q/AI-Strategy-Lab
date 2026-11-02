import { simulationFamilies } from "./data";
import type { ChoiceKind, FamilyResult, MigrationFlow, MovementKind, PurchaseType, SimulationFamily, SimulationMetrics, SimulationResult, Strategy, VehicleStructure } from "./types";

const round = (n: number) => Math.round(n);
const isOwn = (kind: ChoiceKind) => kind === "own-new" || kind === "own-existing";
const totalWeight = simulationFamilies.reduce((sum, family) => sum + family.weight, 0);

function choiceFor(f: SimulationFamily, s: Strategy) {
  if (!s.launchEnabled) return { choice: f.baselineChoice, kind: f.baselineKind, score: .54, reason: "基准组合维持当前选择集合" };
  const fit = s.positioning === "family" ? f.familyFit : s.positioning === "technology" ? f.technologyFit : (f.priceSensitivity + .35) / 1.35;
  const target = s.targetFamily === "all" ? .08 : s.targetFamily === f.segment ? .26 : -.06;
  const affordability = Math.max(-.35, Math.min(.3, (f.budgetCenter - (s.price - s.benefit)) / 12));
  const sales = s.salesPlay === "new-model" ? .14 : s.salesPlay === "portfolio-test-drive" ? .2 : .04;
  const delivery = (8 - s.deliveryWeeks) * .035 * f.urgency;
  const score = .2 + fit * .42 + target + affordability + sales + delivery;
  if (score >= .73) return { choice: "岚境 N7（新车型）", kind: "own-new" as ChoiceKind, score, reason: `定位匹配 +${round(fit * 42)}，目标圈选 ${target > 0 ? "+" : ""}${round(target * 100)}，净成交价/交付共同影响 ${round((affordability + delivery) * 100)}` };
  if (score >= .56) return { choice: f.existingOwnChoice, kind: "own-existing" as ChoiceKind, score, reason: "策略提升我方组合吸引力，但新车型匹配度未越过选择阈值" };
  if (f.urgency < .6 || s.deliveryWeeks >= 9) return { choice: "延迟购买", kind: "delay" as ChoiceKind, score, reason: "交付等待与当前需求紧迫度未形成有效转化" };
  return { choice: f.baselineChoice, kind: f.baselineKind, score, reason: "价格、定位与家庭诉求的综合得分未改变原选择" };
}

function unitEconomics(kind: ChoiceKind, strategy: Strategy) {
  if (!isOwn(kind)) return { revenue: 0, profit: 0, benefit: 0 };
  const isNew = kind === "own-new";
  const transaction = isNew ? strategy.price - strategy.benefit : 29.2;
  return { revenue: transaction, profit: Math.max(2.1, transaction - (isNew ? 24.1 : 23.8)), benefit: isNew ? strategy.benefit : 0 };
}

function aggregate(strategy: Strategy, choices: ReturnType<typeof choiceFor>[]): SimulationMetrics {
  let sales = 0, revenue = 0, profit = 0, benefitCost = 0;
  simulationFamilies.forEach((family, index) => {
    const choice = choices[index];
    if (!isOwn(choice.kind)) return;
    const economics = unitEconomics(choice.kind, strategy);
    sales += family.weight;
    revenue += family.weight * economics.revenue;
    profit += family.weight * economics.profit;
    benefitCost += family.weight * economics.benefit;
  });
  return { sales: round(sales), salesDelta: 0, revenue: round(revenue), revenueDelta: 0, profit: round(profit), profitDelta: 0, trueIncremental: 0, cannibalization: 0, competitorCapture: 0, delayedRelease: 0, retained: 0, lost: 0, familyCoverage: round(sales / totalWeight * 100), coverageDelta: 0, benefitCost: round(benefitCost), roi: 0 };
}

function movementFor(before: ChoiceKind, after: ChoiceKind): MovementKind {
  if (isOwn(after) && before === "competitor") return "竞品抢夺";
  if (isOwn(after) && before === "delay") return "延迟释放";
  if (isOwn(after) && before === "no-purchase") return "真正新增";
  if (after === "own-new" && before === "own-existing") return "内部蚕食";
  if (!isOwn(after) && isOwn(before)) return "流失";
  return "保持";
}

export function runPortfolioSimulation(baseline: Strategy, experiment: Strategy): SimulationResult {
  const before = simulationFamilies.map(family => choiceFor(family, baseline));
  const after = simulationFamilies.map(family => choiceFor(family, experiment));
  const baselineMetrics = aggregate(baseline, before);
  const experimentMetrics = aggregate(experiment, after);
  const families: FamilyResult[] = simulationFamilies.map((family, index) => {
    const b = before[index], a = after[index];
    const movement = movementFor(b.kind, a.kind);
    const newlyOwn = isOwn(a.kind) && !isOwn(b.kind);
    const lostOwn = !isOwn(a.kind) && isOwn(b.kind);
    const beforeEconomics = unitEconomics(b.kind, baseline);
    const afterEconomics = unitEconomics(a.kind, experiment);
    const profitDelta = round(family.weight * (afterEconomics.profit - beforeEconomics.profit));
    return {
      family, baselineChoice: b.choice, baselineKind: b.kind, experimentChoice: a.choice, experimentKind: a.kind,
      reason: a.reason, confidence: Math.min(94, Math.max(55, round(55 + Math.abs(a.score - .6) * 100))),
      unitDelta: newlyOwn ? family.weight : lostOwn ? -family.weight : 0, profitDelta, movement,
      contribution: { sales: newlyOwn ? family.weight : lostOwn ? -family.weight : 0, profit: profitDelta, coverage: newlyOwn ? round(family.weight / totalWeight * 100) : lostOwn ? -round(family.weight / totalWeight * 100) : 0 },
    };
  });
  const sumMovement = (movement: MovementKind) => families.filter(family => family.movement === movement).reduce((sum, family) => sum + family.family.weight, 0);
  experimentMetrics.salesDelta = experimentMetrics.sales - baselineMetrics.sales;
  experimentMetrics.revenueDelta = experimentMetrics.revenue - baselineMetrics.revenue;
  experimentMetrics.profitDelta = experimentMetrics.profit - baselineMetrics.profit;
  experimentMetrics.coverageDelta = experimentMetrics.familyCoverage - baselineMetrics.familyCoverage;
  experimentMetrics.trueIncremental = sumMovement("真正新增");
  experimentMetrics.cannibalization = sumMovement("内部蚕食");
  experimentMetrics.competitorCapture = sumMovement("竞品抢夺");
  experimentMetrics.delayedRelease = sumMovement("延迟释放");
  experimentMetrics.retained = sumMovement("保持");
  experimentMetrics.lost = sumMovement("流失");
  const grossProfitGain = experimentMetrics.profitDelta + experimentMetrics.benefitCost;
  experimentMetrics.roi = experimentMetrics.benefitCost ? Number((grossProfitGain / experimentMetrics.benefitCost).toFixed(2)) : 0;

  const vehicleMap = new Map<string, Omit<VehicleStructure, "share">>();
  simulationFamilies.forEach((family, index) => {
    const choice = after[index];
    if (!isOwn(choice.kind)) return;
    const economics = unitEconomics(choice.kind, experiment);
    const current = vehicleMap.get(choice.choice) ?? { vehicle: choice.choice, kind: choice.kind === "own-new" ? "新车型" : "现有车型", sales: 0, revenue: 0, profit: 0 };
    current.sales += family.weight; current.revenue += family.weight * economics.revenue; current.profit += family.weight * economics.profit;
    vehicleMap.set(choice.choice, current);
  });
  const vehicleStructure = [...vehicleMap.values()].map(vehicle => ({ ...vehicle, sales: round(vehicle.sales), revenue: round(vehicle.revenue), profit: round(vehicle.profit), share: experimentMetrics.sales ? round(vehicle.sales / experimentMetrics.sales * 100) : 0 })).sort((a, b) => b.sales - a.sales);
  const purchaseTypes: PurchaseType[] = ["首购", "增购", "换购"];
  const purchaseStructure = purchaseTypes.map(type => {
    const sales = simulationFamilies.reduce((sum, family, index) => sum + (family.purchaseType === type && isOwn(after[index].kind) ? family.weight : 0), 0);
    return { type, sales: round(sales), share: experimentMetrics.sales ? round(sales / experimentMetrics.sales * 100) : 0 };
  });
  const migrationFlows: MigrationFlow[] = families.map(family => ({ from: family.baselineChoice, to: family.experimentChoice, movement: family.movement, households: family.family.weight, share: round(family.family.weight / totalWeight * 100) }));
  const weightedConfidence = round(families.reduce((sum, family) => sum + family.confidence * family.family.weight, 0) / totalWeight);
  return {
    baseline: baselineMetrics, experiment: experimentMetrics, families, vehicleStructure, purchaseStructure, migrationFlows,
    confidence: { level: weightedConfidence >= 80 ? "高" : weightedConfidence >= 68 ? "中高" : "中", score: weightedConfidence, sampleCoverage: 100, sensitivityRisk: "价格、权益与交付周期接近选择阈值时，结构可能阶跃变化", boundary: "仅覆盖 6 类合成家庭与固定规则，不含市场规模、供给约束和真实因果校准" },
  };
}
