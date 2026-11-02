import { BarChart3, CircleDollarSign, Gauge, Layers3, Users } from "lucide-react";
import type { SimulationResult } from "@/lib/portfolio-simulation";

const fmt = (n: number) => new Intl.NumberFormat("zh-CN").format(n);
const signed = (n: number) => `${n >= 0 ? "+" : ""}${fmt(n)}`;

export default function PortfolioDashboard({ result }: { result: SimulationResult }) {
  const m = result.experiment;
  const cards = [
    { label: "组合销量", value: `${fmt(m.sales)} 辆`, delta: `${signed(m.salesDelta)} vs 基准`, icon: BarChart3 },
    { label: "组合利润", value: `${(m.profit / 10000).toFixed(2)} 亿元`, delta: `${signed(m.profitDelta)} 万元`, icon: CircleDollarSign },
    { label: "家庭覆盖", value: `${m.familyCoverage}%`, delta: `${m.coverageDelta >= 0 ? "+" : ""}${m.coverageDelta} pct`, icon: Users },
    { label: "权益投入产出", value: `${m.roi.toFixed(2)}×`, delta: `投入 ${fmt(m.benefitCost)} 万元`, icon: Gauge },
  ];
  return <div className="space-y-5">
    <section className="rounded-3xl bg-slate-950 p-6 text-white lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="text-[10px] font-bold tracking-[.2em] text-cyan-300">PHASE 3 · PORTFOLIO COCKPIT</span><h3 className="mt-2 text-2xl font-semibold">组合经营结果驾驶舱</h3><p className="mt-2 text-xs text-slate-400">所有指标均由下方合成家庭选择与迁移逐户加总，不是市场预测。</p></div><span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-[10px] font-bold text-amber-200">DETERMINISTIC MOCK</span></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, delta, icon: Icon }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.055] p-4"><div className="flex items-center justify-between text-slate-400"><span className="text-[11px]">{label}</span><Icon size={15}/></div><strong className="mt-3 block text-2xl">{value}</strong><span className="mt-1 block text-[10px] text-cyan-300">{delta}</span></div>)}</div>
    </section>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-2"><Layers3 size={17}/><h4 className="font-semibold">车型销量与利润结构</h4></div><div className="mt-5 space-y-4">{result.vehicleStructure.map(vehicle => <div key={vehicle.vehicle}><div className="mb-2 flex items-end justify-between gap-3"><div><strong className="text-sm">{vehicle.vehicle}</strong><span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-[9px] text-slate-500">{vehicle.kind}</span></div><span className="text-xs text-slate-500">{fmt(vehicle.sales)} 辆 · 利润 {fmt(vehicle.profit)} 万</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-slate-900" style={{width:`${vehicle.share}%`}}/></div><div className="mt-1 flex justify-between text-[9px] text-slate-400"><span>销量占比 {vehicle.share}%</span><span>收入 {(vehicle.revenue / 10000).toFixed(2)} 亿</span></div></div>)}</div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6"><h4 className="font-semibold">购车类型结构</h4><p className="mt-1 text-[11px] text-slate-400">按成交家庭的购车机会类型核算</p><div className="mt-6 space-y-5">{result.purchaseStructure.map(item => <div key={item.type} className="grid grid-cols-[44px_1fr_auto] items-center gap-3"><strong className="text-xs">{item.type}</strong><div className="h-8 overflow-hidden rounded-lg bg-slate-100"><div className="flex h-full items-center px-2 text-[10px] font-bold text-slate-950 bg-cyan-300" style={{width:`${Math.max(item.share, 9)}%`}}>{item.share}%</div></div><span className="text-xs text-slate-500">{fmt(item.sales)}</span></div>)}</div><div className="mt-6 rounded-2xl bg-slate-50 p-4 text-[10px] leading-5 text-slate-500">销量结构之和 = {fmt(result.purchaseStructure.reduce((sum, item) => sum + item.sales, 0))} 辆，与组合销量一致。</div></section>
    </div>
  </div>;
}
