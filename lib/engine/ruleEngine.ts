/**
 * 规则引擎 — 基于业务经验的策略模拟
 * 
 * 这是 P0 版本的核心引擎，从原有 StrategySimulator.tsx 中抽离。
 * 后续将被 ML/DL 模型替代或并行使用。
 */

import {
  SimulationParams,
  SimulationResult,
  DailyResult,
  IEngine,
  ModelInfo,
} from "./types";

// ──────────────────────────────────────────────
// 内部工具函数
// ──────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
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

// 用户画像
interface UserProfile {
  active: boolean;
  type: "light" | "normal" | "heavy";
  baseUsage: number;
  priceSensitivity: number;
  engagement: number;
  remainingFreeQuota: number;
  monthlySpend: number;
}

// ──────────────────────────────────────────────
// 核心模拟逻辑
// ──────────────────────────────────────────────

export function simulateStrategy(
  params: SimulationParams,
  seed: number = 42
): SimulationResult {
  const rand = seededRandom(seed);
  const users: UserProfile[] = [];
  const userCount = params.userCount;

  // ── 初始化用户 ──
  for (let i = 0; i < userCount; i++) {
    const r = rand();
    let type: "light" | "normal" | "heavy" = "normal";
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

  // ── 成本结构 ──
  const cheapModelCost = 0.002;
  const expensiveModelCost = 0.02;
  const blendedCost =
    params.cheapRatio * cheapModelCost +
    (1 - params.cheapRatio) * expensiveModelCost;

  // ── 逐日模拟 ──
  const history: DailyResult[] = [];
  let totalRevenue = 0;
  let totalCost = 0;
  let totalCalls = 0;

  for (let day = 1; day <= params.days; day++) {
    let activeUsers = 0;
    let dayRevenue = 0;
    let dayCost = 0;
    let dayCalls = 0;

    for (const user of users) {
      if (!user.active) continue;

      // 流失风险计算
      let churnRisk = 0.01;
      churnRisk +=
        Math.max(0, params.price - 19) * 0.004 * user.priceSensitivity;
      churnRisk +=
        Math.max(
          0,
          params.qualityTarget -
            (params.cheapRatio * 60 + (1 - params.cheapRatio) * 95)
        ) * 0.0008;
      churnRisk -= params.freeQuota > 0 ? 0.003 : 0;
      churnRisk -= user.engagement * 0.01;
      churnRisk = clamp(churnRisk, 0.003, 0.18);

      if (rand() < churnRisk) {
        user.active = false;
        continue;
      }

      activeUsers += 1;

      // 使用量计算
      let usageMultiplier = 1;
      if (params.freeQuota > 0 && user.remainingFreeQuota > 0)
        usageMultiplier += 0.25;
      if (params.qualityTarget > 80) usageMultiplier += 0.08;
      if (params.price < 15) usageMultiplier += 0.1;

      const callsToday = Math.max(
        0,
        Math.round(user.baseUsage * usageMultiplier * (0.8 + rand() * 0.4))
      );
      let paidCalls = callsToday;

      // 免费额度抵扣
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
    }

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

  // ── 汇总 ──
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

// ──────────────────────────────────────────────
// 规则引擎 — 实现 IEngine 接口
// ──────────────────────────────────────────────

export const ruleEngineInfo: ModelInfo = {
  id: "rule",
  name: "规则引擎",
  type: "规则引擎",
  description: "基于业务经验的规则推导，快速透明，适合策略讨论",
  icon: "⚡",
  requiresGpu: false,
  estimatedLatency: 50,
};

export function explainRuleEngine(
  params: SimulationParams,
  result: SimulationResult
): string {
  const parts: string[] = [];

  parts.push(`基于规则引擎推演：`);

  if (params.price > 25) {
    parts.push(
      `定价 ¥${params.price} 偏高，价格敏感用户流失风险增加。`
    );
  } else if (params.price < 12) {
    parts.push(
      `定价 ¥${params.price} 较低，有利于获客但短期变现承压。`
    );
  }

  if (params.freeQuota > 15) {
    parts.push(
      `免费额度 ${params.freeQuota} 次有效降低试用门槛，但消耗短期收入。`
    );
  }

  if (params.cheapRatio > 0.7) {
    parts.push(
      `廉价模型占比 ${Math.round(params.cheapRatio * 100)}% 较高，成本控制良好但质量感知可能下降。`
    );
  } else if (params.cheapRatio < 0.4) {
    parts.push(
      `廉价模型占比 ${Math.round(params.cheapRatio * 100)}% 较低，质量优先但成本压力较大。`
    );
  }

  parts.push(
    `模拟 ${params.days} 天后，期末留存 ${result.summary.retention}%，` +
      `累计利润 ¥${result.summary.profit.toLocaleString()}。`
  );

  return parts.join("\n");
}

export const ruleEngine: IEngine = {
  info: ruleEngineInfo,
  simulate: simulateStrategy,
  explain: explainRuleEngine,
};
