import { simulationFamilies } from "./data";
import type { ChoiceKind, FamilyResult, SimulationFamily, SimulationMetrics, SimulationResult, Strategy } from "./types";

const round = (n: number) => Math.round(n);
const isOwn = (kind: ChoiceKind) => kind === "own-new" || kind === "own-existing";

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

function aggregate(strategy: Strategy, choices: ReturnType<typeof choiceFor>[]): SimulationMetrics {
  let sales = 0, profit = 0, covered = 0;
  simulationFamilies.forEach((f, i) => {
    const c = choices[i];
    if (isOwn(c.kind)) {
      sales += f.weight;
      const transaction = c.kind === "own-new" ? strategy.price - strategy.benefit : 29.2;
      profit += f.weight * Math.max(2.1, transaction - (c.kind === "own-new" ? 24.1 : 23.8));
      covered += f.weight;
    }
  });
  return { sales: round(sales), salesDelta: 0, profit: round(profit), profitDelta: 0, trueIncremental: 0, cannibalization: 0, competitorCapture: 0, delayedRelease: 0, familyCoverage: round(covered / 50), coverageDelta: 0 };
}

export function runPortfolioSimulation(baseline: Strategy, experiment: Strategy): SimulationResult {
  const before = simulationFamilies.map(f => choiceFor(f, baseline));
  const after = simulationFamilies.map(f => choiceFor(f, experiment));
  const baselineMetrics = aggregate(baseline, before);
  const experimentMetrics = aggregate(experiment, after);
  const families: FamilyResult[] = simulationFamilies.map((family, i) => {
    const b = before[i], a = after[i]; let movement: FamilyResult["movement"] = "保持/其他";
    if (isOwn(a.kind) && b.kind === "competitor") movement = "竞品抢夺";
    else if (isOwn(a.kind) && b.kind === "delay") movement = "延迟释放";
    else if (isOwn(a.kind) && b.kind === "no-purchase") movement = "真正新增";
    else if (a.kind === "own-new" && b.kind === "own-existing") movement = "内部蚕食";
    const newlyOwn = isOwn(a.kind) && !isOwn(b.kind);
    const lostOwn = !isOwn(a.kind) && isOwn(b.kind);
    const familyProfit = (kind: ChoiceKind, strategy: Strategy) => !isOwn(kind) ? 0 : family.weight * Math.max(2.1, kind === "own-new" ? strategy.price - strategy.benefit - 24.1 : 29.2 - 23.8);
    return { family, baselineChoice: b.choice, baselineKind: b.kind, experimentChoice: a.choice, experimentKind: a.kind, reason: a.reason, confidence: Math.min(94, Math.max(55, round(55 + Math.abs(a.score - .6) * 100))), unitDelta: newlyOwn ? family.weight : lostOwn ? -family.weight : 0, profitDelta: round(familyProfit(a.kind, experiment) - familyProfit(b.kind, baseline)), movement };
  });
  const sumMovement = (m: FamilyResult["movement"]) => families.filter(f => f.movement === m).reduce((n, f) => n + f.family.weight, 0);
  experimentMetrics.salesDelta = experimentMetrics.sales - baselineMetrics.sales;
  experimentMetrics.profitDelta = experimentMetrics.profit - baselineMetrics.profit;
  experimentMetrics.familyCoverage = round(simulationFamilies.filter((_, i) => isOwn(after[i].kind)).length / simulationFamilies.length * 100);
  baselineMetrics.familyCoverage = round(simulationFamilies.filter((_, i) => isOwn(before[i].kind)).length / simulationFamilies.length * 100);
  experimentMetrics.coverageDelta = experimentMetrics.familyCoverage - baselineMetrics.familyCoverage;
  experimentMetrics.trueIncremental = sumMovement("真正新增");
  experimentMetrics.cannibalization = sumMovement("内部蚕食");
  experimentMetrics.competitorCapture = sumMovement("竞品抢夺");
  experimentMetrics.delayedRelease = sumMovement("延迟释放");
  return { baseline: baselineMetrics, experiment: experimentMetrics, families };
}
