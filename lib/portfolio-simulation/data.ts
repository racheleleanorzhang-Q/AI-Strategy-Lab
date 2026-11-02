import type { SimulationFamily, Strategy } from "./types";

export const baselineStrategy: Strategy = {
  launchEnabled: false, positioning: "family", price: 31.8, benefit: 0.8,
  targetFamily: "all", salesPlay: "balanced", deliveryWeeks: 8,
};

export const experimentStrategy: Strategy = {
  launchEnabled: true, positioning: "family", price: 30.8, benefit: 1.8,
  targetFamily: "growing", salesPlay: "portfolio-test-drive", deliveryWeeks: 5,
};

export const simulationFamilies: SimulationFamily[] = [
  { id: "F-1027", name: "林屿家庭", segment: "commuter", weight: 860, budgetCenter: 25, priceSensitivity: .95, familyFit: .35, technologyFit: .82, urgency: .7, baselineChoice: "星河 A6", baselineKind: "competitor", existingOwnChoice: "岚境 S5" },
  { id: "F-2084", name: "周原家庭", segment: "growing", weight: 1120, budgetCenter: 34, priceSensitivity: .55, familyFit: .98, technologyFit: .58, urgency: .92, baselineChoice: "山海 X9", baselineKind: "competitor", existingOwnChoice: "岚境 L8" },
  { id: "F-3166", name: "许舟家庭", segment: "commuter", weight: 940, budgetCenter: 28, priceSensitivity: .72, familyFit: .32, technologyFit: .94, urgency: .46, baselineChoice: "延迟购买", baselineKind: "delay", existingOwnChoice: "岚境 S7" },
  { id: "F-4431", name: "沈禾家庭", segment: "upgrade", weight: 760, budgetCenter: 40, priceSensitivity: .32, familyFit: .93, technologyFit: .62, urgency: .84, baselineChoice: "岚境 L9", baselineKind: "own-existing", existingOwnChoice: "岚境 L9" },
  { id: "F-5710", name: "顾岑家庭", segment: "growing", weight: 680, budgetCenter: 22, priceSensitivity: .9, familyFit: .48, technologyFit: .88, urgency: .64, baselineChoice: "继续共用", baselineKind: "no-purchase", existingOwnChoice: "岚境 S5" },
  { id: "F-6842", name: "唐澄家庭", segment: "upgrade", weight: 640, budgetCenter: 25, priceSensitivity: .82, familyFit: .66, technologyFit: .38, urgency: .52, baselineChoice: "岚境 S7", baselineKind: "own-existing", existingOwnChoice: "岚境 S7" },
];
