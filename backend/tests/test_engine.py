"""
测试 — 规则引擎与后端 API
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.base import SimulationParams
from models.rule_engine import RuleEngineModel, simulate_rule_engine
from models.registry import get_model, list_models


def test_rule_engine():
    """测试规则引擎基本功能"""
    params = SimulationParams(
        name="平衡策略",
        price=19,
        free_quota=12,
        cheap_ratio=0.65,
        quality_target=82,
        user_count=1200,
        days=30,
    )

    model = RuleEngineModel()
    result = model.simulate(params, seed=42)

    # 验证基本结构
    assert result.summary.revenue > 0, "收入应为正"
    assert result.summary.cost > 0, "成本应为正"
    assert len(result.history) == 30, "应有 30 天数据"
    assert result.history[0].day == 1, "第一天应为 day 1"
    assert result.history[-1].day == 30, "最后一天应为 day 30"

    # 验证汇总
    assert result.summary.retention > 0, "留存率应为正"
    assert result.summary.retention <= 100, "留存率不应超过 100%"
    assert result.summary.total_calls > 0, "调用次数应为正"

    # 验证解释
    explanation = model.explain(params, result)
    assert len(explanation) > 10, "解释不应为空"

    print("✅ test_rule_engine passed")
    print(f"   收入: ¥{result.summary.revenue:,.2f}")
    print(f"   成本: ¥{result.summary.cost:,.2f}")
    print(f"   利润: ¥{result.summary.profit:,.2f}")
    print(f"   留存: {result.summary.retention}%")
    print(f"   调用: {result.summary.total_calls:,}")


def test_registry():
    """测试模型注册中心"""
    models = list_models()
    assert len(models) >= 1, "至少应有规则引擎"
    
    model = get_model("rule")
    assert model.info.id == "rule"
    assert model.info.name == "规则引擎"

    print("✅ test_registry passed")
    print(f"   已注册模型: {[m.name for m in models]}")


def test_serialization():
    """测试结果序列化"""
    params = SimulationParams(
        name="测试",
        price=19,
        free_quota=12,
        cheap_ratio=0.65,
        quality_target=82,
        user_count=100,
        days=7,
    )

    model = RuleEngineModel()
    result = model.simulate(params, seed=42)
    data = result.to_dict()

    assert "summary" in data
    assert "history" in data
    assert len(data["history"]) == 7

    print("✅ test_serialization passed")


if __name__ == "__main__":
    test_rule_engine()
    test_registry()
    test_serialization()
    print("\n🎉 All tests passed!")
