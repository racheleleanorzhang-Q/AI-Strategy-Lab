"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import StrategyExperiment from "./StrategyExperiment";
import { ArrowLeft, ArrowRight, CarFront, Check, ChevronRight, CircleDollarSign, Clock3, Compass, Database, GitBranch, Home, Info, Route, ShieldCheck, Sparkles, Users } from "lucide-react";

type Family = {
  id: string; name: string; type: string; city: string; members: { role: string; label: string }[];
  garage: string[]; trigger: string; stage: string; budget: string; candidates: string[]; insight: string; color: string;
};

const families: Family[] = [
  { id: "F-1027", name: "林屿家庭", type: "新婚首购", city: "澜州市", members: [{ role: "主决策者", label: "伴侣 A" }, { role: "共同决策", label: "伴侣 B" }], garage: ["暂无车辆"], trigger: "通勤半径扩大", stage: "方案对比", budget: "22–28 万", candidates: ["岚境 S5", "星河 A6", "延迟购买"], insight: "空间够用与月供可控是共同底线，智能体验影响最终偏好。", color: "cyan" },
  { id: "F-2084", name: "周原家庭", type: "二孩增购", city: "青沐市", members: [{ role: "主决策者", label: "母亲" }, { role: "关键影响者", label: "父亲" }, { role: "使用者", label: "祖父母与孩子" }], garage: ["云帆 M3 · 6年"], trigger: "二孩出生", stage: "到店体验", budget: "30–38 万", candidates: ["岚境 L8", "山海 X9", "保留现车"], insight: "三排可达性和全家舒适度优先，置换权益能显著提前决策。", color: "violet" },
  { id: "F-3166", name: "许舟家庭", type: "跨城通勤换购", city: "北辰市", members: [{ role: "主决策者", label: "本人" }, { role: "财务把关", label: "伴侣" }], garage: ["远航 E2 · 5年"], trigger: "跨城项目启动", stage: "需求萌发", budget: "24–32 万", candidates: ["岚境 S7", "曜石 C7", "暂不购买"], insight: "补能效率和高速辅助是核心，当前机会仍可能自然流失。", color: "amber" },
  { id: "F-4431", name: "沈禾家庭", type: "三代同堂换购", city: "云港市", members: [{ role: "主决策者", label: "父亲" }, { role: "共同决策", label: "母亲" }, { role: "高频乘员", label: "祖父母" }], garage: ["苍穹 V6 · 8年", "微光 Q1 · 3年"], trigger: "长途出游增加", stage: "意向确认", budget: "35–45 万", candidates: ["岚境 L9", "山海 X9", "曜石 V8"], insight: "家庭成员诉求分散，需要用场景体验建立车型共识。", color: "emerald" },
  { id: "F-5710", name: "顾岑家庭", type: "精英双车增购", city: "临海市", members: [{ role: "使用决策者", label: "伴侣 B" }, { role: "预算批准", label: "伴侣 A" }], garage: ["曜石 C9 · 2年", "远航 E5 · 4年"], trigger: "独立用车频率提升", stage: "试驾预约", budget: "18–25 万", candidates: ["岚境 S5", "星河 A6", "继续共用"], insight: "目标不是替换豪华车，而是增加一台灵活、高频使用的智能座驾。", color: "rose" },
  { id: "F-6842", name: "唐澄家庭", type: "空巢焕新", city: "栖霞市", members: [{ role: "主决策者", label: "本人" }, { role: "安全顾问", label: "成年子女" }], garage: ["松风 H5 · 10年"], trigger: "退休生活规划", stage: "售后咨询", budget: "20–30 万", candidates: ["岚境 S7", "云帆 M5", "不购买"], insight: "易上手与长期服务信任比参数领先更重要，子女影响安全判断。", color: "blue" },
];

const journey = ["需求产生", "信息探索", "方案对比", "到店/试驾", "意向确认", "成交交付", "用车经营", "增换购周期"];
const graph = [
  { icon: Home, title: "家庭 One ID", text: "聚合成员、关系与家庭需求" },
  { icon: Users, title: "成员角色", text: "决策者、影响者与使用者" },
  { icon: CarFront, title: "家庭车库", text: "车辆持有、车龄与使用分工" },
  { icon: Sparkles, title: "购车机会", text: "事件触发、预算与时间窗口" },
  { icon: Route, title: "用户旅程", text: "持续变化的触点与意向状态" },
  { icon: GitBranch, title: "选择迁移", text: "我方、竞品、延迟与不购买" },
];

export default function PortfolioStrategyDemo() {
  const [selectedId, setSelectedId] = useState(families[0].id);
  const selected = useMemo(() => families.find((family) => family.id === selectedId) ?? families[0], [selectedId]);
  const stageIndex = Math.max(0, journey.findIndex((item) => selected.stage.includes(item) || item.includes(selected.stage)));

  return (
    <main className="min-h-screen bg-[#f3f5f8] text-slate-950">
      <header className="border-b border-white/10 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft size={16} /> AI Strategy Lab</Link>
          <div className="flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold text-amber-200"><Database size={13} /> MOCK / 合成数据</div>
        </div>
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 pb-14 pt-10 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:pb-16">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.26em] text-cyan-300">Portfolio Strategy · Phase 1 + 2</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.035em] md:text-6xl">让每一个家庭的选择，<br /><span className="text-slate-500">成为组合经营的可解释变量。</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400">以家庭 One ID × 用户旅程 × 当前车库 × 候选车型为基础粒度，连接产品、价格与权益变化到选择迁移。从业务世界与数字样本，进入新车型上市后的策略对照、Mock 仿真与家庭下钻。</p>
          </div>
          <div className="self-end rounded-3xl border border-white/10 bg-white/[0.055] p-6">
            <div className="flex items-center justify-between"><span className="text-sm font-medium">场景完整度</span><span className="text-xs text-cyan-300">迭代 0 + 1</span></div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[['6', '家庭样本'], ['8', '旅程阶段'], ['3+3', '我方/竞品']].map(([v,l]) => <div key={l} className="rounded-2xl bg-black/20 p-3"><strong className="block text-2xl">{v}</strong><span className="text-[11px] text-slate-500">{l}</span></div>)}
            </div>
            <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-500"><Info size={14} className="mt-0.5 shrink-0" />所有城市、家庭、品牌、车型与数值均为虚构合成，仅用于产品设计演示。</p>
          </div>
        </div>
      </header>

      <StrategyExperiment />

      <section className="mx-auto max-w-[1440px] px-5 py-14 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-6"><div><p className="section-kicker">01 · BUSINESS WORLD</p><h2 className="section-title">业务世界关系</h2></div><span className="hidden text-xs text-slate-500 md:block">从实体关系开始，而不是从一张结果报表开始</span></div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {graph.map(({ icon: Icon, title, text }, index) => <div key={title} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="mb-6 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-cyan-300"><Icon size={17} /></span><strong className="block text-sm">{title}</strong><p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>{index < graph.length - 1 && <ChevronRight size={15} className="absolute -right-2.5 top-1/2 z-10 hidden rounded-full bg-slate-200 text-slate-500 xl:block" />}</div>)}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/60">
        <div className="mx-auto max-w-[1440px] px-5 py-14 lg:px-8">
          <div className="mb-7"><p className="section-kicker">02 · SYNTHETIC HOUSEHOLDS</p><h2 className="section-title">家庭数字样本浏览器</h2><p className="mt-2 text-sm text-slate-500">选择一个 Mock 家庭，观察同一购车机会如何被成员、车库与旅程阶段共同塑造。</p></div>
          <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <div className="space-y-2">
              {families.map((family) => <button key={family.id} onClick={() => setSelectedId(family.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selected.id === family.id ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-slate-200 bg-white hover:border-slate-400"}`}><div className="flex items-start justify-between"><div><span className="text-[10px] font-bold tracking-widest opacity-50">{family.id}</span><h3 className="mt-1 font-semibold">{family.name}</h3></div><span className={`rounded-full px-2 py-1 text-[10px] ${selected.id === family.id ? "bg-cyan-300/15 text-cyan-200" : "bg-slate-100 text-slate-500"}`}>{family.type}</span></div><p className="mt-3 text-xs opacity-55">{family.city} · {family.stage}</p></button>)}
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid border-b border-slate-200 lg:grid-cols-[1fr_320px]">
                <div className="p-6 lg:p-8"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">One ID · {selected.id}</span><span className="text-xs text-slate-400">{selected.city}</span></div><h3 className="mt-5 text-3xl font-semibold tracking-tight">{selected.name}</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{selected.insight}</p></div>
                <div className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">当前购车机会</span><strong className="mt-2 block text-lg">{selected.trigger}</strong><div className="mt-5 flex justify-between text-xs"><span className="text-slate-400">预算区间</span><span className="font-semibold">{selected.budget}</span></div><div className="mt-2 flex justify-between text-xs"><span className="text-slate-400">旅程状态</span><span className="font-semibold text-cyan-700">{selected.stage}</span></div></div>
              </div>
              <div className="grid gap-4 p-6 lg:grid-cols-3 lg:p-8">
                <Detail title="家庭成员与角色" icon={Users}>{selected.members.map((m) => <div key={m.label} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0"><span className="text-sm">{m.label}</span><span className="text-[11px] text-slate-400">{m.role}</span></div>)}</Detail>
                <Detail title="当前家庭车库" icon={CarFront}>{selected.garage.map((car) => <div key={car} className="flex items-center gap-2 py-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-slate-900" />{car}</div>)}</Detail>
                <Detail title="候选集合" icon={Compass}>{selected.candidates.map((car, i) => <div key={car} className="flex items-center justify-between py-2 text-sm"><span>{car}</span><span className={`text-[10px] font-bold ${i === 0 ? "text-cyan-700" : "text-slate-300"}`}>{i === 0 ? "我方" : i === 1 ? "竞品" : "OUT"}</span></div>)}</Detail>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-14 lg:px-8">
        <div><p className="section-kicker">03 · JOURNEY STATE</p><h2 className="section-title">用户旅程时间轴</h2></div>
        <div className="mt-8 overflow-x-auto pb-3"><div className="flex min-w-[980px] items-start">{journey.map((stage, index) => <div key={stage} className="flex flex-1 items-start"><div className="flex min-w-[102px] flex-col items-center text-center"><span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${index < stageIndex ? "border-slate-950 bg-slate-950 text-white" : index === stageIndex ? "border-cyan-500 bg-cyan-50 text-cyan-700 ring-4 ring-cyan-100" : "border-slate-200 bg-white text-slate-400"}`}>{index < stageIndex ? <Check size={14} /> : index + 1}</span><strong className={`mt-3 text-xs ${index === stageIndex ? "text-cyan-700" : "text-slate-600"}`}>{stage}</strong>{index === stageIndex && <span className="mt-1 text-[10px] text-slate-400">{selected.name}</span>}</div>{index < journey.length - 1 && <span className={`mt-4 h-0.5 flex-1 ${index < stageIndex ? "bg-slate-950" : "bg-slate-200"}`} />}</div>)}</div></div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-14 lg:px-8"><div className="mb-8"><p className="section-kicker text-cyan-300">04 · PORTFOLIO UNIVERSE</p><h2 className="section-title text-white">我方产品与竞品关系</h2><p className="mt-2 text-sm text-slate-500">所有品牌和车型均为虚构。关系表达用于说明候选集合，而非真实市场判断。</p></div><div className="grid gap-5 lg:grid-cols-2"><VehicleGroup title="岚境 · 我方虚构产品组合" badge="OWN PORTFOLIO" vehicles={[['S5','灵活智能轿车','首购 / 增购'],['S7','长途智能 SUV','通勤 / 焕新'],['L8 / L9','家庭旗舰 SUV','多孩 / 三代']]}/><VehicleGroup title="外部虚构竞品集合" badge="COMPETITIVE SET" vehicles={[['星河 A6','纯电轿车','价格重叠'],['山海 X9','大型家庭 SUV','空间重叠'],['曜石 C7 / V8','智能跨界车','体验重叠']]}/></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[[Clock3,'延迟购买','机会沿时间轴继续演化'],[ShieldCheck,'保留现车','现状也应是显式选择'],[CircleDollarSign,'不购买','预算或需求变化导致流失']].map(([Icon,title,text]) => { const I=Icon as typeof Clock3; return <div key={title as string} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><I size={18} className="text-slate-500"/><div><strong className="text-sm">{title as string}</strong><p className="mt-1 text-xs text-slate-500">{text as string}</p></div></div>})}</div></div>
      </section>

      <footer className="bg-slate-950 px-5 pb-10 text-slate-500"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 border-t border-white/10 pt-6 text-xs md:flex-row"><span>AI Strategy Lab · 基于世界模型的通用策略模拟台</span><Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white">返回场景入口 <ArrowRight size={13}/></Link></div></footer>
    </main>
  );
}

function Detail({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500"><Icon size={14}/>{title}</div>{children}</div> }
function VehicleGroup({ title, badge, vehicles }: { title: string; badge: string; vehicles: string[][] }) { return <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-6"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{title}</h3><span className="text-[9px] font-bold tracking-[0.16em] text-cyan-300">{badge}</span></div><div className="mt-5 divide-y divide-white/10">{vehicles.map(([name,desc,fit]) => <div key={name} className="grid grid-cols-[90px_1fr_auto] items-center gap-3 py-4"><strong className="text-sm">{name}</strong><span className="text-xs text-slate-500">{desc}</span><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-400">{fit}</span></div>)}</div></div> }
