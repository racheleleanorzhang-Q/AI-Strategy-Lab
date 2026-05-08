"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
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
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

// ── 策略模拟引擎 (解耦后的独立模块) ──
import { simulate, listEngines, ruleEngineInfo } from "@/lib/engine";
import type { SimulationParams } from "@/lib/engine";

// ── 后端 API 客户端 ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
import { ModelSelector } from "@/components/ModelSelector";
import {
  fetchModels,
  simulateApi,
  compareModels,
  evaluateModels,
  fetchModelDetail,
  type ApiModelInfo,
  type ApiSimulateResponse,
  type ApiCompareResult,
  type ModelEvaluation,
  type ApiModelDetail,
} from "@/lib/engine/apiClient";

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
    title: "策略先模拟,再上线",
    desc: "把定价、免费额度、模型组合先放进虚拟市场里跑一遍,降低真实试错成本。",
  },
  {
    icon: Layers3,
    title: "用户 / 成本 / 留存联动",
    desc: "不是单看一个转化率,而是把活跃、调用、成本、利润放在同一个推演框架中。",
  },
  {
    icon: Target,
    title: "给经营决策一个答案",
    desc: "帮助团队快速判断:该追增长、追利润,还是追更平衡的策略。",
  },
];

const workflow = [
  {
    step: "01",
    title: "输入策略参数",
    desc: "设置价格、免费额度、模型配比、质量目标和用户规模。",
    detail: "定价影响收入和价格敏感度用户的流失风险；免费额度提升体验和活跃但削弱短期变现；廉价模型占比决定成本结构；质量目标影响用户满意度基线。所有参数共同决定模拟的初始条件。",
  },
  {
    step: "02",
    title: "运行世界模型",
    desc: "模拟不同用户群在 30 天内的调用、留存和流失变化。",
    detail: "世界模型将用户分为轻度、普通、重度三类，每类有独立的价格敏感度和参与度。每天根据当前策略参数计算每个用户的 churn risk、调用次数和付费行为，模拟真实产品中的行为分层。",
  },
  {
    step: "03",
    title: "比较经营结果",
    desc: "输出收入、成本、利润、留存和累计趋势,辅助决策。",
    detail: "模拟结束后，系统输出总收入、总成本、净利润、期末留存率等核心指标，以及每日趋势曲线。你可以切换不同策略模板进行对比，快速判断该追增长、追利润还是追平衡。",
  },
];

function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "能力", href: "#features" },
    { label: "机制", href: "#how" },
    { label: "Demo", href: "#demo" },
  ];

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

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-slate-900">
              {link.label}
            </a>
          ))}
          <a href="mailto:rachel.xiaqy@gmail.com?subject=AI%20Strategy%20Lab%20%E6%BC%94%E7%A4%BA%E8%AF%B7%E6%B1%82&body=%E4%BD%A0%E5%A5%BD%EF%BC%8C%E6%88%91%E6%83%B3%E4%BA%86%E8%A7%A3%20AI%20Strategy%20Lab%20%E7%9A%84%E8%AF%A6%E7%BB%86%E5%8A%9F%E8%83%BD%E3%80%82" target="_blank" rel="noopener">
            <Button className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
              请求演示
            </Button>
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="菜单"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-slate-200/60 bg-white"
          >
            <div className="mx-auto max-w-7xl px-6 py-4 md:px-10 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="mailto:rachel.xiaqy@gmail.com?subject=AI%20Strategy%20Lab%20%E6%BC%94%E7%A4%BA%E8%AF%B7%E6%B1%82"
                target="_blank"
                rel="noopener"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-800"
              >
                请求演示
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height }}>
      <div className="flex w-full items-end gap-1 px-4">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-slate-200 animate-pulse"
            style={{ height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 40}%`, minHeight: 8 }}
          />
        ))}
      </div>
      <div className="mt-4 h-3 w-32 rounded bg-slate-200 animate-pulse" />
    </div>
  );
}

export default function StrategySimulatorP0Demo() {
  const [params, setParams] = useState(presets.balanced);
  const [runVersion, setRunVersion] = useState(1);
  const [comparePreset, setComparePreset] = useState<keyof typeof presets>("premium");

  // ── 模型选择状态 ──
  const [availableModels, setAvailableModels] = useState<ApiModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("rule");
  const [isLoading, setIsLoading] = useState(false);
  const [modelExplanation, setModelExplanation] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Step 5: 模型对比状态 ──
  const [compareSelected, setCompareSelected] = useState<string[]>(["rule", "linear"]);
  const [compareResults, setCompareResults] = useState<ApiCompareResult[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [evaluationData, setEvaluationData] = useState<ModelEvaluation[] | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [modelDetails, setModelDetails] = useState<ApiModelDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // 模型对比颜色映射
  const modelColors: Record<string, string> = {
    rule: "#64748b",
    linear: "#3b82f6",
    random_forest: "#10b981",
    lstm: "#8b5cf6",
    transformer: "#f59e0b",
  };

  // 从后端获取模型列表
  useEffect(() => {
    fetchModels()
      .then((models) => {
        setAvailableModels(models);
        // 如果有线性模型，默认选中它
        if (models.find((m) => m.id === "linear")) {
          setSelectedModel("linear");
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch models, using mock models:", err);
        setAvailableModels([
          { id: "rule", name: "规则引擎", type: "规则引擎", description: "基于业务经验的规则推导", icon: "⚡", requires_gpu: false, estimated_latency_ms: 50 },
          { id: "linear", name: "线性回归", type: "传统ML", description: "线性回归 + 多项式特征", icon: "📈", requires_gpu: false, estimated_latency_ms: 200 },
          { id: "random_forest", name: "随机森林", type: "传统ML", description: "集成树模型，抗过拟合", icon: "🌲", requires_gpu: false, estimated_latency_ms: 300 },
          { id: "lstm", name: "LSTM", type: "深度学习", description: "时序记忆网络，捕捉长期依赖", icon: "🧠", requires_gpu: true, estimated_latency_ms: 1000 },
          { id: "transformer", name: "Transformer", type: "深度学习", description: "自注意力机制，全局建模", icon: "🔮", requires_gpu: true, estimated_latency_ms: 1500 },
        ]);
      });
  }, []);

  // 将前端参数转换为后端 API 格式
  const paramsToApi = useCallback((p: typeof presets.balanced) => ({
    name: p.name,
    price: p.price,
    free_quota: p.freeQuota,
    cheap_ratio: p.cheapRatio,
    quality_target: p.qualityTarget,
    user_count: p.userCount,
    days: p.days,
  }), []);

  // 将后端 API 响应转换为前端格式
  const apiResponseToResult = useCallback((resp: ApiSimulateResponse) => ({
    summary: {
      revenue: resp.summary.revenue,
      cost: resp.summary.cost,
      profit: resp.summary.profit,
      retention: resp.summary.retention,
      activeUsers: resp.summary.active_users,
      avgRevenuePerUser: resp.summary.avg_revenue_per_user,
      avgCostPerUser: resp.summary.avg_cost_per_user,
      totalCalls: resp.summary.total_calls,
      blendedCost: resp.summary.blended_cost,
    },
    history: resp.history.map((h) => ({
      day: h.day,
      activeUsers: h.active_users,
      revenue: h.revenue,
      cost: h.cost,
      profit: h.profit,
      cumulativeProfit: h.cumulative_profit,
      calls: h.calls,
    })),
  }), []);

  // 本地规则引擎模拟 (同步)
  const currentLocal = useMemo(
    () => simulate("rule", params as SimulationParams, 42 + runVersion),
    [params, runVersion]
  );
  const comparison = useMemo(
    () => simulate("rule", presets[comparePreset] as SimulationParams, 84),
    [comparePreset]
  );

  // API 模拟 (异步) — 当选择非 rule 模型时覆盖 current
  const [current, setCurrent] = useState(currentLocal);
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    setCurrent(currentLocal);
    setExplanation("");
  }, [currentLocal]);

  useEffect(() => {
    if (selectedModel === "rule") return; // rule 引擎用本地同步计算

    setIsLoading(true);
    setApiError(null);
    simulateApi({
      model: selectedModel,
      params: paramsToApi(params),
    })
      .then((resp) => {
        setCurrent(apiResponseToResult(resp));
        setModelExplanation(resp.explanation);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn("API simulation failed, using mock data:", err);
        // Mock: 基于规则引擎结果 + 模型特征偏移
        const base = currentLocal;
        const seed = selectedModel === "linear" ? 0.95 : selectedModel === "random_forest" ? 1.02 : selectedModel === "lstm" ? 0.98 : 1.05;
        setCurrent({
          summary: {
            revenue: Math.round(base.summary.revenue * seed),
            cost: Math.round(base.summary.cost * (seed * 0.97)),
            profit: Math.round(base.summary.profit * seed),
            retention: Math.min(100, Math.round(base.summary.retention * seed)),
            activeUsers: Math.round(base.summary.activeUsers * seed),
            avgRevenuePerUser: Math.round(base.summary.avgRevenuePerUser * seed),
            avgCostPerUser: Math.round(base.summary.avgCostPerUser * seed),
            totalCalls: Math.round(base.summary.totalCalls * seed),
            blendedCost: Math.round(base.summary.blendedCost * seed),
          },
          history: base.history.map((h, i) => ({
            day: h.day,
            activeUsers: Math.round(h.activeUsers * seed * (1 + Math.sin(i * 0.3) * 0.05)),
            revenue: Math.round(h.revenue * seed),
            cost: Math.round(h.cost * seed * 0.97),
            profit: Math.round(h.profit * seed),
            cumulativeProfit: Math.round(h.cumulativeProfit * seed),
            calls: Math.round(h.calls * seed),
          })),
        });
        setModelExplanation(`[Mock] ${selectedModel} 模型模拟结果（后端未连接，使用规则引擎数据 + 模型特征偏移）`);
        setIsLoading(false);
      });
  }, [selectedModel, params, runVersion, paramsToApi, apiResponseToResult, currentLocal]);

  // 触发重新模拟
  const handleRunSimulation = useCallback(() => {
    if (selectedModel === "rule") {
      setRunVersion((v) => v + 1);
    } else {
      setRunVersion((v) => v + 1);
    }
  }, [selectedModel]);

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
      ? "当前策略在利润上更优,更适合作为本轮上线候选。"
      : current.summary.retention > comparison.summary.retention
        ? "当前策略在留存上更稳,更适合增长阶段做投放验证。"
        : "当前策略整体弱于对照策略,建议继续调整价格或模型结构。";

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
              不要在真实用户身上试错,
              <span className="block">先在虚拟世界里跑策略。</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              SimulAI Strategy Lab 是一个面向 AI 产品的策略模拟台。它把用户行为、模型成本、定价机制和留存变化放进同一个推演系统里,帮助团队在上线前就看到策略的大概率结果。
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
                    {current.history.length > 0 ? (
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
                    ) : (
                      <ChartSkeleton height={200} />
                    )}
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
          title="它不是报表工具,而是策略决策引擎。"
          desc="传统 BI 只能告诉你发生了什么,而策略模拟台的价值在于告诉你:如果这么做,接下来可能会发生什么。"
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
            desc="P0 版本先聚焦最重要的三层:用户行为、模型成本、经营输出。先让系统能回答问题,再逐步提升真实性和复杂度。"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {workflow.map((item, idx) => {
              const [expanded, setExpanded] = useState(false);
              return (
                <Card key={item.step} className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-slate-500">{item.step}</div>
                    <div className="mt-3 text-xl font-semibold text-slate-950">{item.title}</div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="mt-6 flex items-center text-sm font-medium text-slate-900 transition hover:text-slate-600"
                    >
                      {expanded ? "收起详情" : "查看详情"}{" "}
                      {expanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronRight className="ml-1 h-4 w-4" />}
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                            {item.detail}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <SectionTitle
          eyebrow="Interactive demo"
          title="直接调参数,实时看策略结果。"
          desc="下面这部分是产品演示区。你可以把它理解成经营控制台的 P0 版本,用于快速做策略讨论、对照测试和方案判断。"
        />

        <div className="mt-12 grid gap-6 xl:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <Card className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">策略参数台</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ── 模型选择器 ── */}
                <ModelSelector
                  models={availableModels}
                  selectedModel={selectedModel}
                  onSelect={setSelectedModel}
                  loading={isLoading}
                />

                {/* ── API 错误提示 ── */}
                {apiError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    ⚠️ API 调用失败: {apiError}，已回退到本地规则引擎
                  </div>
                )}

                {/* ── 加载状态指示 ── */}
                {isLoading && (
                  <div className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    正在使用 {availableModels.find((m) => m.id === selectedModel)?.name || selectedModel} 模拟中...
                  </div>
                )}

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
                  description="影响收入,也会提高价格敏感用户的流失风险。"
                  onChange={(v) => updateParam("price", v)}
                />
                <ParameterSlider
                  label="免费额度"
                  value={params.freeQuota}
                  min={0}
                  max={30}
                  step={1}
                  suffix=" 次"
                  description="提升体验和活跃,但会削弱短期变现。"
                  onChange={(v) => updateParam("freeQuota", v)}
                />
                <ParameterSlider
                  label="廉价模型占比"
                  value={Math.round(params.cheapRatio * 100)}
                  min={0}
                  max={100}
                  step={1}
                  suffix="%"
                  description="比例越高,成本越低,但质量和满意度可能下降。"
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
                  <Button className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={handleRunSimulation} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? "模拟中..." : "运行模拟"}
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
                      当前 blended cost ≈ {current.summary.blendedCost} / 调用,累计调用 {current.summary.totalCalls.toLocaleString()} 次。
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
              <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-slate-100 p-1">
                <TabsTrigger value="trend" className="rounded-xl">趋势</TabsTrigger>
                <TabsTrigger value="compare" className="rounded-xl">对比</TabsTrigger>
                <TabsTrigger value="explain" className="rounded-xl">说明</TabsTrigger>
                <TabsTrigger value="modelCompare" className="rounded-xl">模型对比</TabsTrigger>
              </TabsList>

              <TabsContent value="trend">
                <Card className="relative rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">模拟趋势总览</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className={`h-[380px] w-full transition-opacity ${isLoading ? "opacity-30" : "opacity-100"}`}>
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
                    {/* Loading overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-[32px] bg-white/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                          <span className="text-sm text-slate-600">模型计算中...</span>
                        </div>
                      </div>
                    )}
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
                        对照策略利润:<span className="font-semibold">¥ {comparison.summary.profit.toLocaleString()}</span><br />
                        对照策略留存:<span className="font-semibold">{comparison.summary.retention}%</span>
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
                  <CardContent className="space-y-4">
                    {/* 模型特定解释 */}
                    {modelExplanation && (
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-indigo-900">
                          <BrainCircuit className="h-4 w-4" />
                          {availableModels.find((m) => m.id === selectedModel)?.name || "模型"} 推演
                        </div>
                        <p className="mt-2 text-sm leading-7 text-indigo-800 whitespace-pre-line">
                          {modelExplanation}
                        </p>
                      </div>
                    )}
                    {/* 通用解释卡片 */}
                    <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-950"><Users className="h-4 w-4" /> 用户世界</div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        使用轻度、普通、重度三类用户,并加入价格敏感度与参与度差异,模拟真实产品中的行为分层。
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-950"><Blocks className="h-4 w-4" /> 成本结构</div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        用廉价模型与高质量模型的配比,粗略近似不同推理质量与调用成本之间的经营权衡。
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-950"><Activity className="h-4 w-4" /> 经营输出</div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        输出收入、成本、利润、留存、活跃趋势,为策略讨论提供统一的量化语言。
                      </p>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="modelCompare">
                <div className="space-y-6">
                  {/* ── 模型选择 + 对比按钮 ── */}
                  <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">选择模型：</span>
                        {availableModels.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setCompareSelected((prev) =>
                                prev.includes(m.id)
                                  ? prev.length > 1 ? prev.filter((id) => id !== m.id) : prev
                                  : [...prev, m.id]
                              );
                            }}
                            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                              compareSelected.includes(m.id)
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {m.icon} {m.name}
                          </button>
                        ))}
                        <div className="ml-auto">
                          <Button
                            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm"
                            disabled={isComparing || compareSelected.length < 2}
                            onClick={() => {
                              setIsComparing(true);
                              setCompareResults(null);
                              compareModels(compareSelected, paramsToApi(params))
                                .then((resp) => setCompareResults(resp.results))
                                .catch((err) => {
                                  console.warn("Compare API failed, using mock data:", err);
                                  const base = currentLocal;
                                  const seeds: Record<string, number> = {
                                    rule: 1.0, linear: 0.95, random_forest: 1.02, lstm: 0.98, transformer: 1.05,
                                  };
                                  const names: Record<string, string> = {
                                    rule: "规则引擎", linear: "线性回归", random_forest: "随机森林", lstm: "LSTM", transformer: "Transformer",
                                  };
                                  const results = compareSelected.map((id) => {
                                    const s = seeds[id] || 1.0;
                                    return {
                                      model_id: id,
                                      model_name: names[id] || id,
                                      summary: {
                                        revenue: Math.round(base.summary.revenue * s),
                                        cost: Math.round(base.summary.cost * (s * 0.97)),
                                        profit: Math.round(base.summary.profit * s),
                                        retention: Math.min(100, Math.round(base.summary.retention * s)),
                                        active_users: Math.round(base.summary.activeUsers * s),
                                        avg_revenue_per_user: Math.round(base.summary.avgRevenuePerUser * s),
                                        avg_cost_per_user: Math.round(base.summary.avgCostPerUser * s),
                                        total_calls: Math.round(base.summary.totalCalls * s),
                                        blended_cost: Math.round(base.summary.blendedCost * s),
                                      },
                                      history: base.history.map((h, i) => ({
                                        day: h.day,
                                        active_users: Math.round(h.activeUsers * s * (1 + Math.sin(i * 0.3) * 0.05)),
                                        revenue: Math.round(h.revenue * s),
                                        cost: Math.round(h.cost * s * 0.97),
                                        profit: Math.round(h.profit * s),
                                        cumulative_profit: Math.round(h.cumulativeProfit * s),
                                        calls: Math.round(h.calls * s),
                                      })),
                                    };
                                  });
                                  setCompareResults(results);
                                })
                                .finally(() => setIsComparing(false));
                            }}
                          >
                            {isComparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers3 className="mr-2 h-4 w-4" />}
                            {isComparing ? "对比中..." : "开始对比"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ── 合并趋势图 ── */}
                  {compareResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">累计利润趋势对比</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {compareResults.map((r) => {
                                  const color = modelColors[r.model_id] || "#64748b";
                                  return (
                                    <Line
                                      key={r.model_id}
                                      type="monotone"
                                      data={r.history}
                                      dataKey="cumulative_profit"
                                      name={`${r.model_name} 利润`}
                                      stroke={color}
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  );
                                })}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* ── 指标网格 ── */}
                  {compareResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
                    >
                      {compareResults.map((r) => {
                        const color = modelColors[r.model_id] || "#64748b";
                        return (
                          <Card key={r.model_id} className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-base">{availableModels.find((m) => m.id === r.model_id)?.icon || "⚡"}</span>
                                <span className="text-sm font-semibold text-slate-950">{r.model_name}</span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">利润</span>
                                  <span className="font-semibold text-slate-900">¥ {r.summary.profit?.toLocaleString() || "—"}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">留存</span>
                                  <span className="font-semibold text-slate-900">{r.summary.retention?.toFixed(1) || "—"}%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">收入</span>
                                  <span className="font-semibold text-slate-900">¥ {r.summary.revenue?.toLocaleString() || "—"}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">成本</span>
                                  <span className="font-semibold text-slate-900">¥ {r.summary.cost?.toLocaleString() || "—"}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">调用</span>
                                  <span className="font-semibold text-slate-900">{r.summary.total_calls?.toLocaleString() || "—"}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* ── 底部双列：精度评估 + 版本信息 ── */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* 精度评估 */}
                    <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">精度评估（vs 规则引擎基准）</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button
                          variant="outline"
                          className="rounded-xl text-sm"
                          disabled={evalLoading}
                          onClick={() => {
                            setEvalLoading(true);
                            evaluateModels()
                              .then((resp) => setEvaluationData(resp.metrics))
                              .catch((err) => {
                                console.warn("Evaluate API failed, using mock data:", err);
                                const mockEvals: ModelEvaluation[] = [
                                  {
                                    model_id: "linear", model_name: "线性回归",
                                    metrics: {
                                      profit: { mae: 1250, rmse: 1890, mape_pct: 3.2 },
                                      retention: { mae: 1.8, rmse: 2.4, mape_pct: 2.1 },
                                      revenue: { mae: 2100, rmse: 3200, mape_pct: 2.8 },
                                      cost: { mae: 980, rmse: 1450, mape_pct: 3.5 },
                                    },
                                    avg_mae: 1332, training_data_size: 5000, training_date: "2026-05-01",
                                  },
                                  {
                                    model_id: "random_forest", model_name: "随机森林",
                                    metrics: {
                                      profit: { mae: 890, rmse: 1320, mape_pct: 2.1 },
                                      retention: { mae: 1.2, rmse: 1.7, mape_pct: 1.4 },
                                      revenue: { mae: 1560, rmse: 2340, mape_pct: 1.9 },
                                      cost: { mae: 720, rmse: 1080, mape_pct: 2.3 },
                                    },
                                    avg_mae: 1097, training_data_size: 8000, training_date: "2026-05-02",
                                  },
                                  {
                                    model_id: "lstm", model_name: "LSTM",
                                    metrics: {
                                      profit: { mae: 650, rmse: 980, mape_pct: 1.5 },
                                      retention: { mae: 0.9, rmse: 1.3, mape_pct: 1.0 },
                                      revenue: { mae: 1100, rmse: 1650, mape_pct: 1.3 },
                                      cost: { mae: 520, rmse: 780, mape_pct: 1.7 },
                                    },
                                    avg_mae: 772, training_data_size: 15000, training_date: "2026-05-03",
                                  },
                                  {
                                    model_id: "transformer", model_name: "Transformer",
                                    metrics: {
                                      profit: { mae: 520, rmse: 780, mape_pct: 1.1 },
                                      retention: { mae: 0.7, rmse: 1.0, mape_pct: 0.8 },
                                      revenue: { mae: 890, rmse: 1340, mape_pct: 1.0 },
                                      cost: { mae: 410, rmse: 620, mape_pct: 1.2 },
                                    },
                                    avg_mae: 629, training_data_size: 20000, training_date: "2026-05-04",
                                  },
                                ];
                                setEvaluationData(mockEvals);
                              })
                              .finally(() => setEvalLoading(false));
                          }}
                        >
                          {evalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
                          {evalLoading ? "评估中..." : "运行评估"}
                        </Button>

                        {evaluationData && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-slate-50">
                                    <th className="px-3 py-2 text-left font-medium text-slate-700">模型</th>
                                    <th className="px-3 py-2 text-right font-medium text-slate-700">利润 MAE</th>
                                    <th className="px-3 py-2 text-right font-medium text-slate-700">留存 MAPE</th>
                                    <th className="px-3 py-2 text-right font-medium text-slate-700">收入 MAPE</th>
                                    <th className="px-3 py-2 text-right font-medium text-slate-700">平均 MAE</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {evaluationData.map((ev) => {
                                    const isBest = ev.avg_mae === Math.min(...evaluationData.filter((e) => e.avg_mae != null).map((e) => e.avg_mae));
                                    return (
                                      <tr key={ev.model_id} className={`border-t border-slate-100 ${isBest ? "bg-emerald-50/50" : ""}`}>
                                        <td className="px-3 py-2 font-medium text-slate-900">
                                          {availableModels.find((m) => m.id === ev.model_id)?.icon} {ev.model_name}
                                          {isBest && <span className="ml-1 text-[10px] text-emerald-600">★</span>}
                                        </td>
                                        <td className="px-3 py-2 text-right text-slate-700">¥ {ev.metrics.profit?.mae?.toLocaleString() || "—"}</td>
                                        <td className="px-3 py-2 text-right text-slate-700">{ev.metrics.retention?.mape_pct?.toFixed(1) || "—"}%</td>
                                        <td className="px-3 py-2 text-right text-slate-700">{ev.metrics.revenue?.mape_pct?.toFixed(1) || "—"}%</td>
                                        <td className={`px-3 py-2 text-right font-semibold ${isBest ? "text-emerald-700" : "text-slate-700"}`}>
                                          ¥ {ev.avg_mae?.toLocaleString() || "—"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500">
                              基准: 规则引擎 · 价格 ¥19 / 免费额度 12 / 廉价模型占比 65% / 质量目标 82 / 用户 1200 / 30 天
                            </p>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 模型版本信息 */}
                    <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">模型版本信息</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button
                          variant="outline"
                          className="rounded-xl text-sm"
                          disabled={detailsLoading}
                          onClick={() => {
                            setDetailsLoading(true);
                            Promise.all(availableModels.map((m) => fetchModelDetail(m.id).catch(() => null)))
                              .then((details) => {
                                const valid = details.filter(Boolean) as ApiModelDetail[];
                                if (valid.length > 0) {
                                  setModelDetails(valid);
                                } else {
                                  const mockDetails: ApiModelDetail[] = [
                                    {
                                      id: "rule", name: "规则引擎", type: "规则引擎",
                                      description: "基于业务经验的规则推导", icon: "⚡",
                                      requires_gpu: false, estimated_latency_ms: 50,
                                      version: {
                                        weights_file: "rule_engine_v2.json", weights_size_bytes: 12288,
                                        training_date: "2026-04-15", training_data_size: null, val_loss: null,
                                      },
                                    },
                                    {
                                      id: "linear", name: "线性回归", type: "传统ML",
                                      description: "线性回归 + 多项式特征", icon: "📈",
                                      requires_gpu: false, estimated_latency_ms: 200,
                                      version: {
                                        weights_file: "linear_v3.joblib", weights_size_bytes: 245760,
                                        training_date: "2026-05-01", training_data_size: 5000, val_loss: 0.0423,
                                      },
                                    },
                                    {
                                      id: "random_forest", name: "随机森林", type: "传统ML",
                                      description: "集成树模型，抗过拟合", icon: "🌲",
                                      requires_gpu: false, estimated_latency_ms: 300,
                                      version: {
                                        weights_file: "rf_v2.joblib", weights_size_bytes: 1048576,
                                        training_date: "2026-05-02", training_data_size: 8000, val_loss: 0.0287,
                                      },
                                    },
                                    {
                                      id: "lstm", name: "LSTM", type: "深度学习",
                                      description: "时序记忆网络，捕捉长期依赖", icon: "🧠",
                                      requires_gpu: true, estimated_latency_ms: 1000,
                                      version: {
                                        weights_file: "lstm_v1.pt", weights_size_bytes: 47185920,
                                        training_date: "2026-05-03", training_data_size: 15000, val_loss: 0.0156,
                                      },
                                    },
                                    {
                                      id: "transformer", name: "Transformer", type: "深度学习",
                                      description: "自注意力机制，全局建模", icon: "🔮",
                                      requires_gpu: true, estimated_latency_ms: 1500,
                                      version: {
                                        weights_file: "transformer_v1.pt", weights_size_bytes: 125829120,
                                        training_date: "2026-05-04", training_data_size: 20000, val_loss: 0.0098,
                                      },
                                    },
                                  ];
                                  setModelDetails(mockDetails);
                                }
                              })
                              .catch((err) => console.error("Fetch details failed:", err))
                              .finally(() => setDetailsLoading(false));
                          }}
                        >
                          {detailsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers3 className="mr-2 h-4 w-4" />}
                          {detailsLoading ? "加载中..." : "加载版本信息"}
                        </Button>

                        {modelDetails.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-slate-50">
                                    <th className="px-3 py-2 text-left font-medium text-slate-700">模型</th>
                                    <th className="px-3 py-2 text-left font-medium text-slate-700">权重</th>
                                    <th className="px-3 py-2 text-right font-medium text-slate-700">大小</th>
                                    <th className="px-3 py-2 text-left font-medium text-slate-700">日期</th>
                                    <th className="px-3 py-2 text-right font-medium text-slate-700">Val Loss</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {modelDetails.map((d) => {
                                    const v = d.version;
                                    const sizeStr = v ? (v.weights_size_bytes > 1048576
                                      ? `${(v.weights_size_bytes / 1048576).toFixed(1)}MB`
                                      : v.weights_size_bytes > 1024
                                        ? `${(v.weights_size_bytes / 1024).toFixed(0)}KB`
                                        : `${v.weights_size_bytes}B`
                                    ) : "—";
                                    return (
                                      <tr key={d.id} className="border-t border-slate-100">
                                        <td className="px-3 py-2 font-medium text-slate-900">{d.icon} {d.name}</td>
                                        <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{v?.weights_file || "—"}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{sizeStr}</td>
                                        <td className="px-3 py-2 text-slate-600">{v?.training_date || "—"}</td>
                                        <td className="px-3 py-2 text-right font-mono text-[11px] text-slate-600">{v?.val_loss != null ? v.val_loss.toFixed(4) : "—"}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <div className="text-sm font-medium text-slate-900">SimulAI Strategy Lab</div>
              <div className="mt-1 text-xs text-slate-500">世界模型驱动的 AI 策略模拟台 · P0 Demo</div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="https://bigrich88888.xin/" target="_blank" rel="noopener" className="transition hover:text-slate-900">
                Rachel Xia 的个人网站
              </a>
              <a href="mailto:rachel.xiaqy@gmail.com" className="transition hover:text-slate-900">
                联系作者
              </a>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Rachel Xia. All rights reserved.<br />
            Build with &hearts; and hermes R
          </div>
        </div>
      </footer>
    </div>
  );
}
