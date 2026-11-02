import Link from "next/link";
import { ArrowRight, Boxes, Sparkles } from "lucide-react";

const scenarios = [
  {
    title: "AI 产品策略",
    description: "推演定价、免费额度、模型成本与用户留存，保留现有完整模拟能力。",
    label: "当前场景",
    href: "#simulator",
    icon: Sparkles,
  },
  {
    title: "产品组合经营策略",
    description: "基于家庭 One ID 与用户旅程，观察家庭在车型组合与竞品之间的选择迁移。",
    label: "NEW · Mock Demo",
    href: "/portfolio-strategy",
    icon: Boxes,
  },
];

export default function ScenarioGateway() {
  return (
    <section className="border-b border-slate-200 bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">AI Strategy Lab · Scenario Hub</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">基于世界模型的通用策略模拟台</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">通过可扩展场景连接不同业务世界，在真实决策发生前，用可解释的数字世界完成策略预演。</p>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">2 个策略场景 · 持续扩展</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {scenarios.map(({ title, description, label, href, icon: Icon }, index) => {
            const body = (
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-white/[0.08]">
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300"><Icon size={20} /></span>
                  <span className="text-[11px] font-semibold tracking-wide text-cyan-300">{label}</span>
                </div>
                <h2 className="mt-5 text-lg font-semibold">{title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p>
                <span className="mt-4 flex items-center gap-2 text-sm font-medium text-white">进入场景 <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
              </div>
            );
            return href.startsWith("/") ? <Link key={title} href={href}>{body}</Link> : <a key={title} href={href} className={index === 0 ? "" : undefined}>{body}</a>;
          })}
        </div>
      </div>
    </section>
  );
}
