import type { Attribution, Calibration, ExperimentPlan } from "./types";
export const deviationPct=(expected:number,actual:number)=>expected===0?0:((actual-expected)/Math.abs(expected))*100;
export function analyzeDeviations(plan:ExperimentPlan):Attribution[]{
 const order=plan.metrics.find(m=>m.id==="order")!; const cann=plan.metrics.find(m=>m.id==="cannibalization")!; const load=plan.guardrails.find(g=>g.id==="storeLoad")!;
 return [
  {reason:"门店高峰承接不足",contribution:42,evidence:`Mock 门店负载 ${load.actual}% 超过 ${load.threshold}% 护栏，试驾后 24h 跟进完成率下降。`},
  {reason:"家庭共同决策等待",contribution:31,evidence:`下订增量较预期低 ${Math.abs(deviationPct(order.expected,order.actual)).toFixed(1)}%，双决策人家庭决策周期长于规则假设。`},
  {reason:"车型替代系数偏低估",contribution:27,evidence:`实际内部蚕食 ${cann.actual} 台，高于预期 ${cann.expected} 台，产品间重叠被低估。`},
 ];
}
export function calibrationSuggestions(plan:ExperimentPlan):Calibration[]{
 const order=plan.metrics.find(m=>m.id==="order")!; const cann=plan.metrics.find(m=>m.id==="cannibalization")!;
 return [
  {parameter:"试驾→下订转化系数",before:"0.45",after:(.45*(order.actual/order.expected)).toFixed(2),reason:"按 Mock 实际/预期下订增量比例缩放"},
  {parameter:"S7 → 新车型替代概率",before:"12%",after:`${Math.round(12*(cann.actual/cann.expected))}%`,reason:"按实际/预期内部蚕食比例校正"},
  {parameter:"门店负载惩罚规则",before:"负载 >90% 时 -8%",after:"负载 >85% 时 -12%",reason:"高峰期承接损耗早于原阈值出现"},
  {parameter:"家庭共同决策周期",before:"7 天",after:"10 天",reason:"双决策人合成家庭转化滞后"},
 ];
}
