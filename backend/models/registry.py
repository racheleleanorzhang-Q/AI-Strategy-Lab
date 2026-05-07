"""
模型注册中心

所有模型通过此模块注册和获取。
新增模型只需 import 对应模块即可自动注册。
"""

from __future__ import annotations

from typing import Dict, Type, List

from .base import BaseModel, ModelInfo, SimulationParams, SimulationResult

# ──────────────────────────────────────────────
# 模型注册表
# ──────────────────────────────────────────────

_model_registry: Dict[str, Type[BaseModel]] = {}


def register_model(cls: Type[BaseModel]) -> Type[BaseModel]:
    """
    装饰器：自动注册模型
    
    使用方式:
        @register_model
        class MyModel(BaseModel):
            ...
    """
    _model_registry[cls.info.fget(self=cls).id] = cls
    return cls


def get_model(model_id: str) -> BaseModel:
    """
    获取并实例化指定模型
    
    Args:
        model_id: 模型 ID
    
    Returns:
        模型实例
    
    Raises:
        ValueError: 模型不存在
    """
    if model_id not in _model_registry:
        available = list(_model_registry.keys())
        raise ValueError(
            f"Unknown model: '{model_id}'. "
            f"Available: {available}"
        )
    return _model_registry[model_id]()


def list_models() -> List[ModelInfo]:
    """获取所有已注册模型的元信息"""
    return [cls().info for cls in _model_registry.values()]


def simulate(model_id: str, params: SimulationParams, seed: int | None = None) -> SimulationResult:
    """
    便捷方法：执行模拟
    
    Args:
        model_id: 模型 ID
        params: 策略参数
        seed: 随机种子
    
    Returns:
        SimulationResult
    """
    model = get_model(model_id)
    return model.simulate(params, seed=seed)


def explain(model_id: str, params: SimulationParams, result: SimulationResult) -> str:
    """
    便捷方法：获取模型解释
    
    Args:
        model_id: 模型 ID
        params: 策略参数
        result: 模拟结果
    
    Returns:
        解释文本
    """
    model = get_model(model_id)
    return model.explain(params, result)


# ──────────────────────────────────────────────
# 手动注册模型
# ──────────────────────────────────────────────

from .rule_engine import RuleEngineModel

# 注册规则引擎
_model_registry[RuleEngineModel().info.id] = RuleEngineModel

# Phase 3 时取消注释以下行:
# from .linear_model import LinearModel
# _model_registry[LinearModel().info.id] = LinearModel
# 
# from .tree_models import RandomForestModel
# _model_registry[RandomForestModel().info.id] = RandomForestModel
#
# from .lstm_model import LSTMModel
# _model_registry[LSTMModel().info.id] = LSTMModel
#
# from .transformer_model import TransformerModel
# _model_registry[TransformerModel().info.id] = TransformerModel
