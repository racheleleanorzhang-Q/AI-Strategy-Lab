import { AlertTriangle, Bot, Lightbulb, Search, Users } from "lucide-react";
import type { SimulationResult } from "@/lib/portfolio-simulation";

const fmt = (n: number) => new Intl.NumberFormat("zh-CN").format(n);
export default function AIInsight({ result }: { result: SimulationResult }) {
  const m = result.experiment;
  const leader = result.vehicleStructure[0];
  const affected = [...result.families].sort((a,b) => Math.abs(b.profitDelta) - Math.abs(a.profitDelta))[0];
  const positive = m.salesDelta >= 0;
  const sections = [
    { title: "发生了什么", icon: Search, text: `实验后组合销量 ${fmt(m.sales)} 辆，较基准${positive ? "增加" : "减少"} ${fmt(Math.abs(m.salesDelta))} 辆；利润变化 ${m.profitDelta >= 0 ? "+" : ""}${fmt(m.profitDelta)} 万元。${leader ? `${leader.vehicle} 贡献 ${leader.share}% 的实验销量。` : "实验未形成我方成交。"}` },
    { title: "为什么", icon: Bot, text: `净变化由真正新增 ${fmt(m.trueIncremental)}、竞品抢夺 ${fmt(m.competitorCapture)}、延迟释放 ${fmt(m.delayedRelease)}，扣除流失 ${fmt(m.lost)} 后形成；另有 ${fmt(m.cannibalization)} 辆内部迁移，不应当作组合新增。` },
    { title: "谁受影响", icon: Users, text: `${affected.family.name}（${affected.family.purchaseType}）利润贡献变化最大，为 ${affected.profitDelta >= 0 ? "+" : ""}${fmt(affected.profitDelta)} 万元；其选择从“${affected.baselineChoice}”变为“${affected.experimentChoice}”。` },
    { title: "风险", icon: AlertTriangle, text: `规则置信度 ${result.confidence.score}%（${result.confidence.level}），${result.confidence.sensitivityRisk}。${result.confidence.boundary}。` },
    { title: "建议", icon: Lightbulb, text: m.cannibalization > m.competitorCapture ? "先收窄新车型权益适用人群，并通过组合试驾把资源集中到竞品与延迟家庭，避免用补贴搬动存量订单。" : `优先承接竞品抢夺与延迟释放家庭，同时监控 ${leader?.vehicle ?? "新车型"} 的交付周期；用小规模线下实验验证转化，不直接据此做产销承诺。` },
  ];
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white"><div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white lg:px-8"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-slate-950"><Bot size={18}/></span><div><span className="text-[9px] font-bold tracking-[.18em] text-cyan-300">STRUCTURED AI EXPLANATION</span><h3 className="text-lg font-semibold">基于本次结果的结构化解释</h3></div></div></div><div className="grid md:grid-cols-2 xl:grid-cols-5">{sections.map(({title,icon:Icon,text}) => <article key={title} className="border-b border-slate-100 p-5 last:border-0 md:border-r xl:border-b-0"><div className="flex items-center gap-2"><Icon size={14} className="text-cyan-700"/><strong className="text-xs">{title}</strong></div><p className="mt-3 text-[11px] leading-5 text-slate-500">{text}</p></article>)}</div><div className="border-t border-amber-100 bg-amber-50 px-6 py-3 text-[10px] leading-5 text-amber-800"><strong>解释边界：</strong>文本由当前确定性 Mock 结果模板化生成，仅复述与推导页面数据；不是大模型预测、真实用户洞察或决策承诺。</div></section>;
}
