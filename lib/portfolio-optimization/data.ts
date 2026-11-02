import type { ObjectiveId, Plan, Weights } from "./types";

export const plans: Plan[] = [
  { id: "growth", name: "增长优先", tag: "抢规模", description: "更强权益与更短交付，覆盖成长和通勤家庭。", strategy: { launchEnabled:true, positioning:"technology", price:29.8, benefit:2.6, targetFamily:"all", salesPlay:"new-model", deliveryWeeks:3 } },
  { id: "profit", name: "利润优先", tag: "守毛利", description: "控制权益、聚焦高价值换购，优先单位经济性。", strategy: { launchEnabled:true, positioning:"family", price:33.8, benefit:.6, targetFamily:"upgrade", salesPlay:"balanced", deliveryWeeks:7 } },
  { id: "balance", name: "平衡经营", tag: "推荐起点", description: "在增量、利润、覆盖和蚕食之间保持中性。", strategy: { launchEnabled:true, positioning:"family", price:31.3, benefit:1.6, targetFamily:"growing", salesPlay:"portfolio-test-drive", deliveryWeeks:5 } },
  { id: "coverage", name: "用户覆盖", tag: "拓人群", description: "质价比定位与全家庭圈选，扩大可服务人群。", strategy: { launchEnabled:true, positioning:"value", price:30.3, benefit:2.0, targetFamily:"all", salesPlay:"portfolio-test-drive", deliveryWeeks:4 } },
];

export const objectiveWeights: Record<ObjectiveId, { name:string; note:string; weights:Weights }> = {
  volume: { name:"销量优先", note:"放大销量与竞品抢夺，接受一定投入", weights:{sales:.32,profit:.14,coverage:.18,cannibalization:.08,capture:.15,benefitCost:.05,confidence:.08} },
  profit: { name:"利润优先", note:"利润与权益效率优先，控制风险", weights:{sales:.12,profit:.36,coverage:.10,cannibalization:.10,capture:.08,benefitCost:.14,confidence:.10} },
  coverage: { name:"用户覆盖优先", note:"覆盖广度和外部转化优先", weights:{sales:.18,profit:.10,coverage:.32,cannibalization:.08,capture:.17,benefitCost:.06,confidence:.09} },
  balanced: { name:"平衡经营", note:"兼顾规模、收益、覆盖与稳健性", weights:{sales:.19,profit:.20,coverage:.16,cannibalization:.11,capture:.12,benefitCost:.10,confidence:.12} },
};
export const metricLabels = { sales:"组合销量", profit:"组合利润", coverage:"家庭覆盖", cannibalization:"内部蚕食", capture:"竞品抢夺", benefitCost:"权益成本", confidence:"置信度" } as const;
