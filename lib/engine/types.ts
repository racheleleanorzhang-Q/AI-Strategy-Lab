/**
 * 策略模拟引擎 — 类型定义
 * 
 * 所有模型（规则引擎、ML、DL）共享这些类型，
 * 确保输入输出格式统一。
 */

// ──────────────────────────────────────────────
// 输入参数
// ──────────────────────────────────────────────

export interface SimulationParams {
  /** 策略名称 */
  name: string;
  /** 定价（元） */
  price: number;
  /** 免费额度（次） */
  freeQuota: number;
  /** 廉价模型占比 (0-1) */
  cheapRatio: number;
  /** 质量目标 (60-95) */
  qualityTarget: number;
  /** 初始用户数 */
  userCount: number;
  /** 模拟天数 */
  days: number;
}

// ──────────────────────────────────────────────
// 每日模拟结果
// ──────────────────────────────────────────────

export interface DailyResult {
  /** 第几天 */
  day: number;
  /** 当日活跃用户数 */
  activeUsers: number;
  /** 当日收入 */
  revenue: number;
  /** 当日成本 */
  cost: number;
  /** 当日利润 */
  profit: number;
  /** 累计利润 */
  cumulativeProfit: number;
  /** 当日调用次数 */
  calls: number;
}

// ──────────────────────────────────────────────
// 模拟汇总结果
// ──────────────────────────────────────────────

export interface SimulationSummary {
  /** 总收入 */
  revenue: number;
  /** 总成本 */
  cost: number;
  /** 总利润 */
  profit: number;
  /** 期末留存率 (%) */
  retention: number;
  /** 期末活跃用户数 */
  activeUsers: number;
  /** 平均收入 per 用户 */
  avgRevenuePerUser: number;
  /** 平均成本 per 用户 */
  avgCostPerUser: number;
  /** 总调用次数 */
  totalCalls: number;
  /** 混合成本 per 调用 */
  blendedCost: number;
}

// ──────────────────────────────────────────────
// 完整模拟结果
// ──────────────────────────────────────────────

export interface SimulationResult {
  /** 汇总指标 */
  summary: SimulationSummary;
  /** 每日趋势 */
  history: DailyResult[];
}

// ──────────────────────────────────────────────
// 模型元信息
// ──────────────────────────────────────────────

export type ModelType = "规则引擎" | "传统ML" | "深度学习";

export interface ModelInfo {
  /** 模型 ID（用于 API 调用） */
  id: string;
  /** 模型显示名称 */
  name: string;
  /** 模型类型 */
  type: ModelType;
  /** 模型说明 */
  description: string;
  /** 图标 emoji */
  icon: string;
  /** 是否需要 GPU */
  requiresGpu: boolean;
  /** 预估推理延迟 (ms) */
  estimatedLatency: number;
}

// ──────────────────────────────────────────────
// 模型接口（前端抽象）
// ──────────────────────────────────────────────

export interface IEngine {
  /** 模型信息 */
  info: ModelInfo;
  /** 执行模拟 */
  simulate(params: SimulationParams, seed?: number): SimulationResult;
  /** 模型解释 */
  explain(params: SimulationParams, result: SimulationResult): string;
}
