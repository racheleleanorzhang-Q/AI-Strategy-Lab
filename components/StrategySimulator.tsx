"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from "recharts";
import { motion } from "framer-motion";
import {
  Play,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Users,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Blocks,
  Radar,
  Activity,
  Target,
  ShieldCheck,
  Layers3,
  ChevronRight,
} from "lucide-react";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function simulateStrategy(params: any, seed: number = 42) {
  const rand = seededRandom(seed);
  const users = [];
  const userCount = params.userCount;

  for (let i = 0; i < userCount; i++) {
    const r = rand();
    let type = "normal";
    if (r < 0.2) type = "light";
    else if (r > 0.8) type = "heavy";

    const baseUsage =
      type === "light"
        ? 1 + Math.floor(rand() * 3)
        : type === "heavy"
          ? 8 + Math.floor(rand() * 8)
          : 3 + Math.floor(rand() * 5);
    const priceSensitivity =
      type === "light"
        ? 0.6 + rand() * 0.3
        : type === "heavy"
          ? 0.15 + rand() * 0.25
          : 0.3 + rand() * 0.35;
    const engagement =
      type === "light"
        ? 0.45 + rand() * 0.15
        : type === "heavy"
          ? 0.75 + rand() * 0.2
          : 0.55 + rand() * 0.2;

    users.push({
      active: true,
      type,
      baseUsage,
      priceSensitivity,
      engagement,
      remainingFreeQuota: params.freeQuota,
      monthlySpend: 0,
    });
  }

  const cheapModelCost = 0.002;
  const expensiveModelCost = 0.02;
  const blendedCost = params.cheapRatio * cheapModelCost + (1 - params.cheapRatio) * expensiveModelCost;

  const history = [];
  let totalRevenue = 0;
  let totalCost = 0;
  let totalCalls = 0;

  for (let day = 1; day <= params.days; day++) {
    let activeUsers = 0;
    let dayRevenue = 0;
    let dayCost = 0;
    let dayCalls = 0;

    users.forEach((user) => {
      if (!user.active) return;

      let churnRisk = 0.01;
      churnRisk += Math.max(0, params.price - 19) * 0.004 * user.priceSensitivity;
      churnRisk += Math.max(0, params.qualityTarget - (params.cheapRatio * 60 + (1 - params.cheapRatio) * 95)) * 0.0008;
      churnRisk -= params.freeQuota > 0 ? 0.003 : 0;
      churnRisk -= user.engagement * 0.01;
      churnRisk = clamp(churnRisk, 0.003, 0.18);

      if (rand() < churnRisk) {
        user.active = false;
        return;
      }

      activeUsers += 1;

      let usageMultiplier = 1;
      if (params.freeQuota > 0 && user.remainingFreeQuota > 0) usageMultiplier += 0.25;
      if (params.qualityTarget > 80) usageMultiplier += 0.08;
      if (params.price < 15) usageMultiplier += 0.1;

      const callsToday = Math.max(0, Math.round(user.baseUsage * usageMultiplier * (0.8 + rand() * 0.4)));
      let paidCalls = callsToday;

      if (user.remainingFreeQuota > 0) {
        const freeUsed = Math.min(user.remainingFreeQuota, callsToday);
        paidCalls -= freeUsed;
        user.remainingFreeQuota -= freeUsed;
      }

      const pricePerCall = params.price / 100;
      const revenueToday = paidCalls * pricePerCall;
      const costToday = callsToday * blendedCost;

      user.monthlySpend += revenueToday;
      dayRevenue += revenueToday;
      dayCost += costToday;
      dayCalls += callsToday;
    });

    totalRevenue += dayRevenue;
    totalCost += dayCost;
    totalCalls += dayCalls;

    history.push({
      day,
      activeUsers,
      revenue: Number(dayRevenue.toFixed(2)),
      cost: Number(dayCost.toFixed(2)),
      profit: Number((dayRevenue - dayCost).toFixed(2)),
      cumulativeProfit: Number((totalRevenue - totalCost).toFixed(2)),
      calls: dayCalls,
    });
  }

  const endingActive = history[history.length - 1]?.activeUsers ?? 0;
  const retention = userCount ? (endingActive / userCount) * 100 : 0;
  const avgRevenuePerUser = userCount ? totalRevenue / userCount : 0;
  const avgCostPerUser = userCount ? totalCost / userCount : 0;

  return {
    summary: {
      revenue: Number(totalRevenue.toFixed(2)),
      cost: Number(totalCost.toFixed(2)),
      profit: Number((totalRevenue - totalCost).toFixed(2)),
      retention: Number(retention.toFixed(1)),
      activeUsers: endingActive,
      avgRevenuePerUser: Number(avgRevenuePerUser.toFixed(2)),
      avgCostPerUser: Number(avgCostPerUser.toFixed(2)),
      totalCalls,
      blendedCost: Number(blendedCost.toFixed(4)),
    },
    history,
  };
}

const presets = {
  balanced: {
    name: "平衡策略",
    price: 19,
    freeQuota: 12,
    cheapRatio: 0.65,
    qualityTarget: 82,
    userCount: 1200,
    days: 30,
  },
  growth: {
    name: "增长优先",
    price: 12,
    freeQuota: 20,
    cheapRatio: 0.78,
    qualityTarget: 76,
    userCount: 1200,
    days: 30,
  },
  premium: {
    name: "利润优先",
    price: 28,
    freeQuota: 5,
    cheapRatio: 0.35,
    qualityTarget: 90,
    userCount: 1200,
    days: 30,
  },
};

const featureCards = [
  {
    icon: Radar,
    title: "策略先模拟，再上线",
    desc: "把定价、免费额度、模型组合先放进虚拟市场里跑一遍，降低真实试错成本。",
  },
  {
    icon: Layers3,
    title: "用户 / 成本 / 留存联动",
    desc: "不是单看一个转化率，而是把活跃、调用、成本、利润放在同一个推演框架中。",
  },
  {
    icon: Target,
    title: "给经营决策一个答案",
    desc: "帮助团队快速判断：该追增长、追利润，还是追更平衡的策略。",
  },
];

const workflow = [
  {
    step: "01",
    title: "输入策略参数",
    desc: "设置价格、免费额度、模型配比、质量目标和用户规模。",
  },
  {
    step: "02",
    title: "运行世界模型",
    desc: "模拟不同用户群在 30 天内的调用、留存和流失变化。",
  },
  {
    step: "03",
    title: "比较经营结果",
    desc: "输出收入、成本、利润、留存和累计趋势，辅助决策。",
  },
];

function NavBar() {
  return (
    <div className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">SimulAI Strategy Lab</div>
            <div className="text-xs text-slate-500">世界模型驱动的 AI 策略模拟台</div>
          </div>
        </div>
        <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <a href="#features" className="transition hover:text-slate-900">能力</a>
          <a href="#how" className="transition hover:text-slate-900">机制</a>
          <a href="#demo" className="transition hover:text-slate-900">Demo</a>
        </div>
        <Button className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
          请求演示
        </Button>
      </div>
    </div>
  );
}

function MetricCard({ title, value, hint, icon: Icon }: { title: string; value: string; hint: string; icon: any }) {
  return (
    <Card className="rounded-3xl border border-slate-200/70 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">{title}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
            <div className="mt-1 text-xs text-slate-500">{hint}</div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ParameterSlider({ label, value, min, max, step, onChange, suffix = "", description }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string; description: string }) {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-800">{label}</Label>
          <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
        </div>
        <div className="min-w-[78px] rounded-2xl bg-slate-100 px-3 py-1 text-right text-sm font-medium text-slate-800">
          {value}{suffix}
        </div>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-sm font-medium text-slate-500">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{desc}</p>
    </div>
  );
}

export default function StrategySimulatorP0Demo() {
  const [params, setParams] = useState(presets.balanced);
  const [runVersion, setRunVersion] = useState(1);
  const [comparePreset, setComparePreset] = useState<keyof typeof presets>("premium");

  const current = useMemo(() => simulateStrategy(params, 42 + runVersion), [params, runVersion]);
  const comparison = useMemo(() => simulateStrategy(presets[comparePreset], 84), [comparePreset]);

  const comparisonBars = [
    { name: "当前策略", profit: current.summary.profit, retention: current.summary.retention },
    { name: presets[comparePreset].name, profit: comparison.summary.profit, retention: comparison.summary.retention },
  ];

  const heroStats = [
    { label: "策略试错成本", value: "更低" },
    { label: "模拟维度", value: "用户 × 成本 × 留存" },
    { label: "决策输出", value: "增长 / 利润 / 平衡" },
  ];

  const updateParam = (key: string, value: any) => setParams((prev) => ({ ...prev, [key]: value }));
  const applyPreset = (key: keyof typeof presets) => setParams(presets[key]);

  const recommendation =
    current.summary.profit > comparison.summary.profit
      ? "当前策略在利润上更优，更适合作为本轮上线候选。"
      : current.summary.retention > comparison.summary.retention
        ? "当前策略在留存上更稳，更适合增长阶段做投放验证。"
        : "当前策略整体弱于对照策略，建议继续调整价格或模型结构。";

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-900">
      <NavBar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_24%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Badge className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-slate-700 hover:bg-white">
              AI Strategy OS · Product Demo
            </Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl md:leading-[1.05]">
              不要在真实用户身上试错，
              <span className="block">先在虚拟世界里跑策略。</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              SimulAI Strategy Lab 是一个面向 AI 产品的策略模拟台。它把用户行为、模型成本、定价机制和留存变化放进同一个推演系统里，帮助团队在上线前就看到策略的大概率结果。
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#demo">
                <Button className="rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800">
                  进入交互 Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Button variant="outline" className="rounded-2xl border-slate-300 bg-white px-6 hover:bg-slate-50">
                查看产品能力
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <div className="text-sm text-slate-500">{item.label}</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="relative"
          >
            <Card className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-slate-950 text-white shadow-2xl">
              <CardContent className="p-0">
                <div className="border-b border-white/10 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Live Preview</div>
                      <div className="mt-1 text-xl font-semibold">策略经营面板</div>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Simulation Ready</Badge>
                  </div>
                </div>
                <div className="grid gap-4 p-6 md:grid-cols-2">
                  <div className="rounded-3xl bg-white/5 p-5">
                    <div className="text-sm text-slate-400">累计利润</div>
                    <div className="mt-2 text-3xl font-semibold">¥ {current.summary.profit.toLocaleString()}</div>
                    <div className="mt-2 text-xs text-slate-400">基于当前默认平衡策略模拟</div>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-5">
                    <div className="text-sm text-slate-400">期末留存</div>
                    <div className="mt-2 text-3xl font-semibold">{current.summary.retention}%</div>
                    <div className="mt-2 text-xs text-slate-400">用户世界模型推演结果</div>
                  </div>
                  <div className="col-span-full h-[240px] rounded-3xl bg-white p-4 text-slate-900">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={current.history}>
                        <defs>
                          <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="currentColor" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="currentColor" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="cumulativeProfit" strokeWidth={2} fill="url(#profitFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <SectionTitle
          eyebrow="Why this product"
          title="它不是报表工具，而是策略决策引擎。"
          desc="传统 BI 只能告诉你发生了什么，而策略模拟台的价值在于告诉你：如果这么做，接下来可能会发生什么。"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {featureCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="h-full rounded-[28px] border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-800" />
                    </div>
                    <div className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{item.title}</div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="how" className="border-y border-slate-200 bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <SectionTitle
            eyebrow="How it works"
            title="一个适合 AI 产品团队的最小世界模型。"
            desc="P0 版本先聚焦最重要的三层：用户行为、模型成本、经营输出。先让系统能回答问题，再逐步提升真实性和复杂度。"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {workflow.map((item) => (
              <Card key={item.step} className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="text-sm font-medium text-slate-500">{item.step}</div>
                  <div className="mt-3 text-xl font-semibold text-slate-950">{item.title}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
                  <div className="mt-6 flex items-center text-sm font-medium text-slate-900">
                    查看详情 <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <SectionTitle
          eyebrow="Interactive demo"
          title="直接调参数，实时看策略结果。"
          desc="下面这部分是产品演示区。你可以把它理解成经营控制台的 P0 版本，用于快速做策略讨论、对照测试和方案判断。"
        />

        <div className="mt-12 grid gap-6 xl:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <Card className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">策略参数台</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>策略名称</Label>
                    <Input value={params.name} onChange={(e) => updateParam("name", e.target.value)} className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>模拟天数</Label>
                    <Input
                      type="number"
                      min={7}
                      max={90}
                      value={params.days}
                      onChange={(e) => updateParam("days", clamp(Number(e.target.value) || 30, 7, 90))}
                      className="rounded-2xl"
                    />
                  </div>
                </div>

                <ParameterSlider
                  label="定价"
                  value={params.price}
                  min={5}
                  max={39}
                  step={1}
                  suffix=" 元"
                  description="影响收入，也会提高价格敏感用户的流失风险。"
                  onChange={(v) => updateParam("price", v)}
                />
                <ParameterSlider
                  label="免费额度"
                  value={params.freeQuota}
                  min={0}
                  max={30}
                  step={1}
                  suffix=" 次"
                  description="提升体验和活跃，但会削弱短期变现。"
                  onChange={(v) => updateParam("freeQuota", v)}
                />
                <ParameterSlider
                  label="廉价模型占比"
                  value={Math.round(params.cheapRatio * 100)}
                  min={0}
                  max={100}
                  step={1}
                  suffix="%"
                  description="比例越高，成本越低，但质量和满意度可能下降。"
                  onChange={(v) => updateParam("cheapRatio", v / 100)}
                />
                <ParameterSlider
                  label="质量目标"
                  value={params.qualityTarget}
                  min={60}
                  max={95}
                  step={1}
                  description="用户对产品输出质量的预期基线。"
                  onChange={(v) => updateParam("qualityTarget", v)}
                />
                <ParameterSlider
                  label="初始用户数"
                  value={params.userCount}
                  min={300}
                  max={5000}
                  step={100}
                  description="用于观察策略在规模放大后的表现。"
                  onChange={(v) => updateParam("userCount", v)}
                />

                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <Button className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => setRunVersion((v) => v + 1)}>
                    <Play className="mr-2 h-4 w-4" /> 运行模拟
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={() => setParams(presets.balanced)}>
                    <RotateCcw className="mr-2 h-4 w-4" /> 恢复默认
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border border-emerald-200 bg-emerald-50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div>
                    <div className="font-medium text-emerald-900">策略建议</div>
                    <p className="mt-2 text-sm leading-7 text-emerald-900/80">{recommendation}</p>
                    <p className="mt-3 text-xs leading-6 text-emerald-800/70">
                      当前 blended cost ≈ {current.summary.blendedCost} / 调用，累计调用 {current.summary.totalCalls.toLocaleString()} 次。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="总收入" value={`¥ ${current.summary.revenue.toLocaleString()}`} hint="模拟期累计收入" icon={DollarSign} />
              <MetricCard title="总成本" value={`¥ ${current.summary.cost.toLocaleString()}`} hint="模型调用累计成本" icon={TrendingUp} />
              <MetricCard title="总利润" value={`¥ ${current.summary.profit.toLocaleString()}`} hint="收入减去成本" icon={BrainCircuit} />
              <MetricCard title="留存率" value={`${current.summary.retention}%`} hint={`期末活跃 ${current.summary.activeUsers} 人`} icon={Users} />
            </div>

            <Tabs defaultValue="trend" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-1">
                <TabsTrigger value="trend" className="rounded-xl">趋势</TabsTrigger>
                <TabsTrigger value="compare" className="rounded-xl">对比</TabsTrigger>
                <TabsTrigger value="explain" className="rounded-xl">说明</TabsTrigger>
              </TabsList>

              <TabsContent value="trend">
                <Card className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">模拟趋势总览</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[380px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={current.history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="activeUsers" name="活跃用户" strokeWidth={2} />
                          <Line type="monotone" dataKey="revenue" name="日收入" strokeWidth={2} />
                          <Line type="monotone" dataKey="profit" name="日利润" strokeWidth={2} />
                          <Line type="monotone" dataKey="cumulativeProfit" name="累计利润" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compare">
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <Card className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">策略模板对照</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(presets).map(([key, preset]: [string, any]) => (
                        <button
                          key={key}
                          onClick={() => setComparePreset(key as keyof typeof presets)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${comparePreset === key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"}`}
                        >
                          <div className="font-medium">{preset.name}</div>
                          <div className={`mt-1 text-xs ${comparePreset === key ? "text-slate-300" : "text-slate-500"}`}>
                            价格 {preset.price} / 免费额度 {preset.freeQuota} / 廉价模型占比 {Math.round(preset.cheapRatio * 100)}%
                          </div>
                        </button>
                      ))}
                      <div className="rounded-3xl bg-slate-100 p-4 text-sm leading-7 text-slate-700">
                        对照策略利润：<span className="font-semibold">¥ {comparison.summary.profit.toLocaleString()}</span><br />
                        对照策略留存：<span className="font-semibold">{comparison.summary.retention}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">利润 / 留存双维对比</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[380px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comparisonBars}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="profit" name="利润">
                              {comparisonBars.map((_, index) => (
                                <Cell key={`profit-${index}`} />
                              ))}
                            </Bar>
                            <Bar dataKey="retention" name="留存率">
                              {comparisonBars.map((_, index) => (
                                <Cell key={`retention-${index}`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="explain">
                <Card className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">模型解释层</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-950"><Users className="h-4 w-4" /> 用户世界</div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        使用轻度、普通、重度三类用户，并加入价格敏感度与参与度差异，模拟真实产品中的行为分层。
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-950"><Blocks className="h-4 w-4" /> 成本结构</div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        用廉价模型与高质量模型的配比，粗略近似不同推理质量与调用成本之间的经营权衡。
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-950"><Activity className="h-4 w-4" /> 经营输出</div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        输出收入、成本、利润、留存、活跃趋势，为策略讨论提供统一的量化语言。
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <Card className="overflow-hidden rounded-[36px] border border-slate-200 bg-slate-950 text-white shadow-xl">
          <CardContent className="grid gap-8 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <div>
              <div className="text-sm text-slate-400">For AI Product Teams</div>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight">把这个 Demo，继续升级成真正的经营控制台。</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                下一步可以接入真实日志、分渠道用户、实验结果、模型路由和更复杂的世界模型，让它从“演示系统”变成“上线前的决策系统”。
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Button className="rounded-2xl bg-white text-slate-950 hover:bg-slate-100">查看下一阶段 Roadmap</Button>
                <Button variant="secondary" className="rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
                  导出融资演示版
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-5">
                <div className="text-sm text-slate-400">P1</div>
                <div className="mt-2 text-lg font-semibold">接入真实数据</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">日志、留存 cohort、模型调用成本、渠道标签。</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <div className="text-sm text-slate-400">P2</div>
                <div className="mt-2 text-lg font-semibold">自动策略搜索</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">让系统自动寻找更优定价与模型路由组合。</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <div className="text-sm text-slate-400">P3</div>
                <div className="mt-2 text-lg font-semibold">在线决策引擎</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">从离线模拟走向实时推荐与策略调度。</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <div className="text-sm text-slate-400">定位</div>
                <div className="mt-2 text-lg font-semibold">Strategy OS</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">不是看报表，而是让团队先看到策略后果。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
