"""
策略模拟引擎 — 类型定义

所有模型（规则引擎、ML、DL）共享这些类型，
确保输入输出格式统一。
"""

from __future__ import annotations

import math
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional


# ──────────────────────────────────────────────
# 输入参数
# ──────────────────────────────────────────────

@dataclass
class SimulationParams:
    """策略参数"""
    price: float                    # 定价（元）
    free_quota: int                 # 免费额度（次）
    cheap_ratio: float              # 廉价模型占比 (0-1)
    quality_target: float           # 质量目标 (60-95)
    user_count: int                 # 初始用户数
    days: int                       # 模拟天数
    name: str = "自定义策略"         # 策略名称


# ──────────────────────────────────────────────
# 每日模拟结果
# ──────────────────────────────────────────────

@dataclass
class DailyResult:
    """每日模拟结果"""
    day: int                        # 第几天
    active_users: int               # 当日活跃用户数
    revenue: float                  # 当日收入
    cost: float                     # 当日成本
    profit: float                   # 当日利润
    cumulative_profit: float        # 累计利润
    calls: int                      # 当日调用次数


# ──────────────────────────────────────────────
# 模拟汇总结果
# ──────────────────────────────────────────────

@dataclass
class SimulationSummary:
    """模拟汇总指标"""
    revenue: float                  # 总收入
    cost: float                     # 总成本
    profit: float                   # 总利润
    retention: float                # 期末留存率 (%)
    active_users: int               # 期末活跃用户数
    avg_revenue_per_user: float     # 平均收入 per 用户
    avg_cost_per_user: float        # 平均成本 per 用户
    total_calls: int                # 总调用次数
    blended_cost: float             # 混合成本 per 调用


# ──────────────────────────────────────────────
# 完整模拟结果
# ──────────────────────────────────────────────

@dataclass
class SimulationResult:
    """完整模拟结果"""
    summary: SimulationSummary
    history: List[DailyResult]

    def to_dict(self) -> Dict[str, Any]:
        """序列化为 JSON 兼容字典"""
        return {
            "summary": asdict(self.summary),
            "history": [asdict(d) for d in self.history],
        }


# ──────────────────────────────────────────────
# 模型元信息
# ──────────────────────────────────────────────

@dataclass
class ModelInfo:
    """模型元信息"""
    id: str                         # 模型 ID（用于 API 调用）
    name: str                       # 模型显示名称
    model_type: str                 # 模型类型: 规则引擎 / 传统ML / 深度学习
    description: str                # 模型说明
    icon: str = "⚡"                # 图标 emoji
    requires_gpu: bool = False      # 是否需要 GPU
    estimated_latency_ms: int = 50  # 预估推理延迟 (ms)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.model_type,
            "description": self.description,
            "icon": self.icon,
            "requires_gpu": self.requires_gpu,
            "estimated_latency_ms": self.estimated_latency_ms,
        }


# ──────────────────────────────────────────────
# 模型基类 (ABC)
# ──────────────────────────────────────────────

class BaseModel(ABC):
    """所有模型的基类"""

    @property
    @abstractmethod
    def info(self) -> ModelInfo:
        """模型元信息"""
        pass

    @abstractmethod
    def simulate(self, params: SimulationParams, seed: Optional[int] = None) -> SimulationResult:
        """执行模拟，返回标准化结果"""
        pass

    @abstractmethod
    def explain(self, params: SimulationParams, result: SimulationResult) -> str:
        """模型解释：为什么得出这个结果"""
        pass
