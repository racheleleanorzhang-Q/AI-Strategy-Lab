/**
 * 策略模拟引擎 — 统一入口
 * 
 * 提供模型注册、获取、列表等统一接口。
 * 前端通过此模块调用所有模型。
 */

import { IEngine, ModelInfo, SimulationParams, SimulationResult } from "./types";
import { ruleEngine, ruleEngineInfo } from "./ruleEngine";

// ──────────────────────────────────────────────
// 模型注册表
// ──────────────────────────────────────────────

const engineRegistry: Map<string, IEngine> = new Map();

// 注册默认引擎
engineRegistry.set(ruleEngineInfo.id, ruleEngine);

// ──────────────────────────────────────────────
// 公共 API
// ──────────────────────────────────────────────

/**
 * 注册一个新引擎
 */
export function registerEngine(engine: IEngine): void {
  engineRegistry.set(engine.info.id, engine);
}

/**
 * 获取指定引擎
 */
export function getEngine(id: string): IEngine | undefined {
  return engineRegistry.get(id);
}

/**
 * 获取所有已注册引擎的元信息
 */
export function listEngines(): ModelInfo[] {
  return Array.from(engineRegistry.values()).map((e) => e.info);
}

/**
 * 执行模拟（便捷方法）
 */
export function simulate(
  engineId: string,
  params: SimulationParams,
  seed?: number
): SimulationResult {
  const engine = getEngine(engineId);
  if (!engine) {
    // Fallback 到规则引擎
    console.warn(`Engine "${engineId}" not found, falling back to rule engine`);
    return ruleEngine.simulate(params, seed);
  }
  return engine.simulate(params, seed);
}

/**
 * 获取模型解释
 */
export function explain(
  engineId: string,
  params: SimulationParams,
  result: SimulationResult
): string {
  const engine = getEngine(engineId);
  if (!engine) return "未知模型，无法解释";
  return engine.explain(params, result);
}

// ──────────────────────────────────────────────
// 导出类型和实现
// ──────────────────────────────────────────────

export type {
  SimulationParams,
  DailyResult,
  SimulationSummary,
  SimulationResult,
  ModelInfo,
  IEngine,
  ModelType,
} from "./types";

export { ruleEngine, ruleEngineInfo, simulateStrategy, explainRuleEngine } from "./ruleEngine";
