"""
策略模拟引擎模块

提供模型注册、获取、模拟等统一接口。
"""

from .base import (
    BaseModel,
    ModelInfo,
    SimulationParams,
    SimulationResult,
    SimulationSummary,
    DailyResult,
)
from .registry import (
    register_model,
    get_model,
    list_models,
    simulate,
    explain,
)

__all__ = [
    # 类型
    "BaseModel",
    "ModelInfo",
    "SimulationParams",
    "SimulationResult",
    "SimulationSummary",
    "DailyResult",
    # 注册中心
    "register_model",
    "get_model",
    "list_models",
    "simulate",
    "explain",
]
