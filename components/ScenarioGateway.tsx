import Link from "next/link";
import { ArrowRight, Boxes, CalendarDays, Sparkles, Users } from "lucide-react";

const scenarioGroups = [
  {
    title: "汽车销售经营场景",
    description: "围绕产品组合、线下获客与车主增长，逐步形成汽车销售经营策略闭环。",
    gridClassName: "md:grid-cols-3",
    scenarios: [
      {
        title: "产品组合经营策略",
        description: "基于家庭 One ID 与用户旅程，观察家庭在车型组合与竞品之间的选择迁移。",
        label: "Mock Demo",
        href: "/portfolio-strategy",
        icon: Boxes,
      },
      {
        title: "线下活动策略",
        description: "比较城市、门店、活动、人群与预算组合，寻找更有效的线下获客方案。",
        label: "规划中",
        icon: CalendarDays,
      },
      {
        title: "车主运营策略",
        description: "围绕车主推荐、复购与增购，比较人群、权益与触达策略的经营结果。",
        label: "规划中",
        icon: Users,
      },
    ],
  },
  {
    title: "其他行业示例",
    description: "展示同一策略模拟方法在非汽车业务中的应用。",
    gridClassName: "md:grid-cols-2",
    scenarios: [
      {
        title: "AI 产品经营策略",
        description: "推演定价、免费额度、模型成本与用户留存，在增长、体验和利润之间寻找平衡。",
        label: "通用演示",
        href: "#simulator",
        icon: Sparkles,
      },
    ],
  },
];

export default function ScenarioGateway() {
  return (
    <section className="border-b border-slate-200 bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">AI Strategy Lab · Scenario Hub</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">基于世界模型的通用策略模拟台</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">通过可扩展场景连接不同业务世界，在真实决策发生前，用可解释的数字世界完成策略预演。</p>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">3 个汽车经营场景 · 1 个通用示例</span>
        </div>

        <div className="space-y-9">
          {scenarioGroups.map(({ title, description, gridClassName, scenarios }) => (
            <div key={title}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
              </div>
              <div className={`grid gap-4 ${gridClassName}`}>
                {scenarios.map(({ title: scenarioTitle, description: scenarioDescription, label, href, icon: Icon }) => {
                  const body = (
                    <div
                      className={
                        href
                          ? "group h-full rounded-2xl border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-white/[0.08]"
                          : "h-full rounded-2xl border border-dashed border-white/10 bg-white/[0.035] p-5"
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className={`rounded-xl p-2.5 ${href ? "bg-cyan-400/10 text-cyan-300" : "bg-white/5 text-slate-500"}`}>
                          <Icon size={20} />
                        </span>
                        <span className={`text-[11px] font-semibold tracking-wide ${href ? "text-cyan-300" : "text-slate-500"}`}>{label}</span>
                      </div>
                      <h3 className="mt-5 text-lg font-semibold">{scenarioTitle}</h3>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{scenarioDescription}</p>
                      {href ? (
                        <span className="mt-4 flex items-center gap-2 text-sm font-medium text-white">
                          进入场景 <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                        </span>
                      ) : (
                        <span className="mt-4 block text-sm font-medium text-slate-500">能力建设中</span>
                      )}
                    </div>
                  );

                  if (!href) {
                    return <div key={scenarioTitle} aria-disabled="true">{body}</div>;
                  }

                  return href.startsWith("/") ? (
                    <Link key={scenarioTitle} href={href}>{body}</Link>
                  ) : (
                    <a key={scenarioTitle} href={href}>{body}</a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
