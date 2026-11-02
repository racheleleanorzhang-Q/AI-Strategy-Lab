import { baselineStrategy, runPortfolioSimulation } from "@/lib/portfolio-simulation";
import { metricLabels } from "./data";
import type { EvaluatedPlan, MetricId, Plan, SensitivityRow, SensitivityVariable, Weights } from "./types";

const positive: MetricId[] = ["sales","profit","coverage","capture","confidence"];
const metricsOf = (r:ReturnType<typeof runPortfolioSimulation>) => ({ sales:r.experiment.sales, profit:r.experiment.profit, coverage:r.experiment.familyCoverage, cannibalization:r.experiment.cannibalization, capture:r.experiment.competitorCapture, benefitCost:r.experiment.benefitCost, confidence:r.confidence.score });
export function evaluatePlans(plans:Plan[], weights:Weights, referencePlans:Plan[] = plans):EvaluatedPlan[] {
  const raw = plans.map(plan=>{const result=runPortfolioSimulation(baselineStrategy,plan.strategy);return {plan,result,metrics:metricsOf(result)};});
  const ids=Object.keys(weights) as MetricId[];
  const referenceMetrics = referencePlans.map(plan => metricsOf(runPortfolioSimulation(baselineStrategy, plan.strategy)));
  const ranges=Object.fromEntries(ids.map(id=>[id,{min:Math.min(...referenceMetrics.map(x=>x[id])),max:Math.max(...referenceMetrics.map(x=>x[id]))}])) as Record<MetricId,{min:number;max:number}>;
  return raw.map(x=>{
    const contributions=ids.map(metric=>{const {min,max}=ranges[metric]; const base=max===min?.5:(x.metrics[metric]-min)/(max-min); const normalized=positive.includes(metric)?base:1-base; return {metric,normalized,weight:weights[metric],points:normalized*weights[metric]*100};});
    return {...x,score:Number(contributions.reduce((s,c)=>s+c.points,0).toFixed(1)),contributions};
  }).sort((a,b)=>b.score-a.score);
}
function scoreAgainstPeers(plan:Plan, peers:Plan[], weights:Weights){return evaluatePlans(peers,weights).find(x=>x.plan.id===plan.id)!;}
export function analyzeSensitivity(plan:Plan, peers:Plan[], weights:Weights):SensitivityRow[]{
  const base=scoreAgainstPeers(plan,peers,weights); const specs:{variable:SensitivityVariable;label:string;minusLabel:string;plusLabel:string;minus:Plan;plus:Plan}[]=[
    {variable:"price",label:"指导价",minusLabel:"-1.0 万",plusLabel:"+1.0 万",minus:{...plan,id:plan.id+"-p",strategy:{...plan.strategy,price:plan.strategy.price-1}},plus:{...plan,id:plan.id+"+p",strategy:{...plan.strategy,price:plan.strategy.price+1}}},
    {variable:"benefit",label:"上市权益",minusLabel:"-0.6 万",plusLabel:"+0.6 万",minus:{...plan,id:plan.id+"-b",strategy:{...plan.strategy,benefit:Math.max(0,plan.strategy.benefit-.6)}},plus:{...plan,id:plan.id+"+b",strategy:{...plan.strategy,benefit:plan.strategy.benefit+.6}}},
    {variable:"delivery",label:"交付周期",minusLabel:"-2 周",plusLabel:"+2 周",minus:{...plan,id:plan.id+"-d",strategy:{...plan.strategy,deliveryWeeks:Math.max(2,plan.strategy.deliveryWeeks-2)}},plus:{...plan,id:plan.id+"+d",strategy:{...plan.strategy,deliveryWeeks:plan.strategy.deliveryWeeks+2}}},
    {variable:"salesPlay",label:"销售动作",minusLabel:"均衡推荐",plusLabel:"新车主推",minus:{...plan,id:plan.id+"-s",strategy:{...plan.strategy,salesPlay:"balanced"}},plus:{...plan,id:plan.id+"+s",strategy:{...plan.strategy,salesPlay:"new-model"}}},
    {variable:"positioning",label:"产品定位",minusLabel:"高质价比",plusLabel:"智能科技",minus:{...plan,id:plan.id+"-o",strategy:{...plan.strategy,positioning:"value"}},plus:{...plan,id:plan.id+"+o",strategy:{...plan.strategy,positioning:"technology"}}},
  ];
  return specs.map(s=>{const variants=evaluatePlans([...peers.filter(p=>p.id!==plan.id),plan,s.minus,s.plus],weights,peers); const get=(id:string)=>variants.find(v=>v.plan.id===id)!;const m=get(s.minus.id),p=get(s.plus.id);const row={variable:s.variable,label:s.label,minusLabel:s.minusLabel,plusLabel:s.plusLabel,salesImpact:[m.metrics.sales-base.metrics.sales,p.metrics.sales-base.metrics.sales] as [number,number],profitImpact:[m.metrics.profit-base.metrics.profit,p.metrics.profit-base.metrics.profit] as [number,number],scoreImpact:[m.score-base.score,p.score-base.score] as [number,number],importance:0};row.importance=Math.max(...row.scoreImpact.map(Math.abs));return row;}).sort((a,b)=>b.importance-a.importance);
}
export function recommendationText(best:EvaluatedPlan, sensitivity:SensitivityRow[], objectiveName:string){
 const strongest=best.contributions.slice().sort((a,b)=>b.points-a.points).slice(0,2).map(c=>metricLabels[c.metric]).join("、");
 const tradeoff=best.contributions.slice().sort((a,b)=>a.points-b.points)[0];
 return {why:`在“${objectiveName}”权重下，${best.plan.name}以 ${best.score.toFixed(1)} 分领先；主要由${strongest}贡献。`,tradeoff:`该建议不是预测结论。其相对弱项是${metricLabels[tradeoff.metric]}（贡献 ${tradeoff.points.toFixed(1)} 分），需要经营者判断是否接受。`,variable:`最关键变量为${sensitivity[0]?.label ?? "价格"}；在当前扰动范围内，综合分最大变化 ${sensitivity[0]?.importance.toFixed(1) ?? "0"} 分。`,risk:`置信度 ${best.metrics.confidence}%；仅基于 6 类合成家庭和固定阈值，临界点可能造成阶跃变化，未纳入供给和真实市场因果。`};
}
