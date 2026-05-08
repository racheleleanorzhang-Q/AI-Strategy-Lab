/**
 * 后端 API 客户端
 * 
 * 与 FastAPI 后端通信，获取模型列表和执行模拟。
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8100";

// ──────────────────────────────────────────────
// 类型定义（与后端对齐）
// ──────────────────────────────────────────────

export interface ApiModelInfo {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  requires_gpu: boolean;
  estimated_latency_ms: number;
}

export interface ApiSimulateRequest {
  model: string;
  params: {
    name: string;
    price: number;
    free_quota: number;
    cheap_ratio: number;
    quality_target: number;
    user_count: number;
    days: number;
  };
}

export interface ApiSimulateResponse {
  model_name: string;
  summary: {
    revenue: number;
    cost: number;
    profit: number;
    retention: number;
    active_users: number;
    avg_revenue_per_user: number;
    avg_cost_per_user: number;
    total_calls: number;
    blended_cost: number;
  };
  history: Array<{
    day: number;
    active_users: number;
    revenue: number;
    cost: number;
    profit: number;
    cumulative_profit: number;
    calls: number;
  }>;
  explanation: string;
}

// ──────────────────────────────────────────────
// API 方法
// ──────────────────────────────────────────────

/**
 * 获取可用模型列表
 */
export async function fetchModels(): Promise<ApiModelInfo[]> {
  const res = await fetch(`${API_BASE}/api/models`);
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  return res.json();
}

/**
 * 执行模拟（调用后端 API）
 */
export async function simulateApi(
  request: ApiSimulateRequest
): Promise<ApiSimulateResponse> {
  const res = await fetch(`${API_BASE}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Simulation failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<{ status: string; models: number }> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────────
// Step 5: 多模型对比 API
// ──────────────────────────────────────────────

/** 单模型对比结果 */
export interface ApiCompareResult {
  model_id: string;
  model_name: string;
  summary: {
    revenue: number; cost: number; profit: number; retention: number;
    active_users: number; avg_revenue_per_user: number;
    avg_cost_per_user: number; total_calls: number; blended_cost: number;
  };
  history: Array<{
    day: number; active_users: number; revenue: number; cost: number;
    profit: number; cumulative_profit: number; calls: number;
  }>;
}

/** 多模型对比响应 */
export interface ApiCompareResponse {
  results: ApiCompareResult[];
}

/** 单指标误差 */
export interface ModelMetric {
  mae: number;
  rmse: number;
  mape_pct: number;
}

/** 单模型评估 */
export interface ModelEvaluation {
  model_id: string;
  model_name: string;
  metrics: {
    profit: ModelMetric;
    retention: ModelMetric;
    revenue: ModelMetric;
    cost: ModelMetric;
  };
  avg_mae: number;
  training_data_size: number | null;
  training_date: string;
}

/** 精度评估响应 */
export interface ApiEvaluateResponse {
  baseline: string;
  baseline_summary: {
    revenue: number; cost: number; profit: number; retention: number;
    active_users: number; avg_revenue_per_user: number;
    avg_cost_per_user: number; total_calls: number; blended_cost: number;
  };
  metrics: ModelEvaluation[];
}

/** 模型版本信息 */
export interface ModelVersionInfo {
  weights_file: string;
  weights_size_bytes: number;
  training_date: string;
  training_data_size: number | null;
  val_loss: number | null;
}

/** 模型详细信息 */
export interface ApiModelDetail extends ApiModelInfo {
  version: ModelVersionInfo | null;
}

/**
 * 多模型对比
 */
export async function compareModels(
  models: string[],
  params: Record<string, any>
): Promise<ApiCompareResponse> {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ models, params }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Compare failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * 模型精度评估
 */
export async function evaluateModels(): Promise<ApiEvaluateResponse> {
  const res = await fetch(`${API_BASE}/api/evaluate`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evaluate failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * 获取模型详细信息（含版本）
 */
export async function fetchModelDetail(modelId: string): Promise<ApiModelDetail> {
  const res = await fetch(`${API_BASE}/api/models/${modelId}/info`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch model detail failed (${res.status}): ${text}`);
  }
  return res.json();
}
