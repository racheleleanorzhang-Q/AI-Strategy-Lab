"""
规则引擎 — 基于业务经验的策略模拟

这是 P0 版本的核心引擎，从前端 TypeScript 版本移植。
后续将被 ML/DL 模型替代或并行使用。
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import List, Optional

from .base import (
    BaseModel,
    ModelInfo,
    SimulationParams,
    SimulationResult,
    SimulationSummary,
    DailyResult,
)


# ──────────────────────────────────────────────
# 内部数据结构
# ──────────────────────────────────────────────

@dataclass
class UserProfile:
    """用户画像"""
    active: bool
    user_type: str          # "light" | "normal" | "heavy"
    base_usage: int
    price_sensitivity: float
    engagement: float
    remaining_free_quota: int
    monthly_spend: float = 0.0


# ──────────────────────────────────────────────
# 核心模拟逻辑
# ──────────────────────────────────────────────

def simulate_rule_engine(
    params: SimulationParams,
    seed: int = 42,
) -> SimulationResult:
    """
    规则引擎模拟 — 与前端 TypeScript 版本逻辑一致
    
    Args:
        params: 策略参数
        seed: 随机种子（保证可复现）
    
    Returns:
        SimulationResult: 标准化模拟结果
    """
    rng = random.Random(seed)
    users: List[UserProfile] = []
    user_count = params.user_count

    # ── 初始化用户 ──
    for _ in range(user_count):
        r = rng.random()
        if r < 0.2:
            user_type = "light"
        elif r > 0.8:
            user_type = "heavy"
        else:
            user_type = "normal"

        if user_type == "light":
            base_usage = 1 + int(rng.random() * 3)
            price_sensitivity = 0.6 + rng.random() * 0.3
            engagement = 0.45 + rng.random() * 0.15
        elif user_type == "heavy":
            base_usage = 8 + int(rng.random() * 8)
            price_sensitivity = 0.15 + rng.random() * 0.25
            engagement = 0.75 + rng.random() * 0.2
        else:
            base_usage = 3 + int(rng.random() * 5)
            price_sensitivity = 0.3 + rng.random() * 0.35
            engagement = 0.55 + rng.random() * 0.2

        users.append(UserProfile(
            active=True,
            user_type=user_type,
            base_usage=base_usage,
            price_sensitivity=price_sensitivity,
            engagement=engagement,
            remaining_free_quota=params.free_quota,
        ))

    # ── 成本结构 ──
    cheap_model_cost = 0.002
    expensive_model_cost = 0.02
    blended_cost = (
        params.cheap_ratio * cheap_model_cost
        + (1 - params.cheap_ratio) * expensive_model_cost
    )

    # ── 逐日模拟 ──
    history: List[DailyResult] = []
    total_revenue = 0.0
    total_cost = 0.0
    total_calls = 0

    for day in range(1, params.days + 1):
        active_users = 0
        day_revenue = 0.0
        day_cost = 0.0
        day_calls = 0

        for user in users:
            if not user.active:
                continue

            # 流失风险计算
            churn_risk = 0.01
            churn_risk += max(0, params.price - 19) * 0.004 * user.price_sensitivity
            quality_diff = params.quality_target - (
                params.cheap_ratio * 60 + (1 - params.cheap_ratio) * 95
            )
            churn_risk += max(0, quality_diff) * 0.0008
            if params.free_quota > 0:
                churn_risk -= 0.003
            churn_risk -= user.engagement * 0.01
            churn_risk = max(0.003, min(0.18, churn_risk))

            if rng.random() < churn_risk:
                user.active = False
                continue

            active_users += 1

            # 使用量计算
            usage_multiplier = 1.0
            if params.free_quota > 0 and user.remaining_free_quota > 0:
                usage_multiplier += 0.25
            if params.quality_target > 80:
                usage_multiplier += 0.08
            if params.price < 15:
                usage_multiplier += 0.1

            calls_today = max(
                0,
                round(user.base_usage * usage_multiplier * (0.8 + rng.random() * 0.4))
            )
            paid_calls = calls_today

            # 免费额度抵扣
            if user.remaining_free_quota > 0:
                free_used = min(user.remaining_free_quota, calls_today)
                paid_calls -= free_used
                user.remaining_free_quota -= free_used

            price_per_call = params.price / 100
            revenue_today = paid_calls * price_per_call
            cost_today = calls_today * blended_cost

            user.monthly_spend += revenue_today
            day_revenue += revenue_today
            day_cost += cost_today
            day_calls += calls_today

        total_revenue += day_revenue
        total_cost += day_cost
        total_calls += day_calls

        history.append(DailyResult(
            day=day,
            active_users=active_users,
            revenue=round(day_revenue, 2),
            cost=round(day_cost, 2),
            profit=round(day_revenue - day_cost, 2),
            cumulative_profit=round(total_revenue - total_cost, 2),
            calls=day_calls,
        ))

    # ── 汇总 ──
    ending_active = history[-1].active_users if history else 0
    retention = (ending_active / user_count * 100) if user_count else 0
    avg_revenue_per_user = total_revenue / user_count if user_count else 0
    avg_cost_per_user = total_cost / user_count if user_count else 0

    return SimulationResult(
        summary=SimulationSummary(
            revenue=round(total_revenue, 2),
            cost=round(total_cost, 2),
            profit=round(total_revenue - total_cost, 2),
            retention=round(retention, 1),
            active_users=ending_active,
            avg_revenue_per_user=round(avg_revenue_per_user, 2),
            avg_cost_per_user=round(avg_cost_per_user, 2),
            total_calls=total_calls,
            blended_cost=round(blended_cost, 4),
        ),
        history=history,
    )


# ──────────────────────────────────────────────
# 规则引擎 — 实现 BaseModel 接口
# ──────────────────────────────────────────────

RULE_ENGINE_INFO = ModelInfo(
    id="rule",
    name="规则引擎",
    model_type="规则引擎",
    description="基于业务经验的规则推导，快速透明，适合策略讨论",
    icon="⚡",
    requires_gpu=False,
    estimated_latency_ms=50,
)


class RuleEngineModel(BaseModel):
    """规则引擎模型"""

    @property
    def info(self) -> ModelInfo:
        return RULE_ENGINE_INFO

    def simulate(
        self,
        params: SimulationParams,
        seed: Optional[int] = None,
    ) -> SimulationResult:
        return simulate_rule_engine(params, seed=seed if seed is not None else 42)

    def explain(self, params: SimulationParams, result: SimulationResult) -> str:
        parts: list[str] = []

        parts.append("基于规则引擎推演：")

        if params.price > 25:
            parts.append(f"定价 ¥{params.price} 偏高，价格敏感用户流失风险增加。")
        elif params.price < 12:
            parts.append(f"定价 ¥{params.price} 较低，有利于获客但短期变现承压。")

        if params.free_quota > 15:
            parts.append(f"免费额度 {params.free_quota} 次有效降低试用门槛，但消耗短期收入。")

        cheap_pct = round(params.cheap_ratio * 100)
        if params.cheap_ratio > 0.7:
            parts.append(f"廉价模型占比 {cheap_pct}% 较高，成本控制良好但质量感知可能下降。")
        elif params.cheap_ratio < 0.4:
            parts.append(f"廉价模型占比 {cheap_pct}% 较低，质量优先但成本压力较大。")

        parts.append(
            f"模拟 {params.days} 天后，期末留存 {result.summary.retention}%，"
            f"累计利润 ¥{result.summary.profit:,.2f}。"
        )

        return "\n".join(parts)
