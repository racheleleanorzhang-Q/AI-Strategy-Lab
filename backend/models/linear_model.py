"""
线性回归 / 逻辑回归模型

基于规则引擎生成的合成数据训练，可解释性强。
"""

from __future__ import annotations

import os
import json
import joblib
from typing import List, Dict, Any, Optional

import numpy as np
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from .base import (
    BaseModel,
    ModelInfo,
    SimulationParams,
    SimulationResult,
    SimulationSummary,
    DailyResult,
)
from .rule_engine import simulate_rule_engine, RULE_ENGINE_INFO


# ──────────────────────────────────────────────
# 特征工程
# ──────────────────────────────────────────────

FEATURE_NAMES = [
    "price",
    "free_quota",
    "cheap_ratio",
    "quality_target",
    "user_count",
    "days",
    # 交互特征
    "price_x_free_quota",
    "price_x_cheap_ratio",
    "quality_x_cheap_ratio",
    "user_count_x_days",
]


def build_features(params: SimulationParams) -> np.ndarray:
    """
    从策略参数构建特征向量
    
    包含原始特征和交互特征。
    """
    return np.array([
        params.price,
        params.free_quota,
        params.cheap_ratio,
        params.quality_target,
        params.user_count,
        params.days,
        # 交互特征
        params.price * params.free_quota,
        params.price * params.cheap_ratio,
        params.quality_target * params.cheap_ratio,
        params.user_count * params.days,
    ])


# ──────────────────────────────────────────────
# 模型定义
# ──────────────────────────────────────────────

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "weights")
MODEL_PATHS = {
    "profit": os.path.join(MODEL_DIR, "profit_model.joblib"),
    "retention": os.path.join(MODEL_DIR, "retention_model.joblib"),
    "revenue": os.path.join(MODEL_DIR, "revenue_model.joblib"),
    "cost": os.path.join(MODEL_DIR, "cost_model.joblib"),
}


class LinearModel(BaseModel):
    """线性回归模型"""

    def __init__(self):
        self.models: Dict[str, Pipeline] = {}
        self._load_or_train()

    def _load_or_train(self):
        """加载预训练模型或训练新模型"""
        os.makedirs(MODEL_DIR, exist_ok=True)

        for target, path in MODEL_PATHS.items():
            if os.path.exists(path):
                self.models[target] = joblib.load(path)
            else:
                # 训练新模型
                self.models[target] = self._train_target(target)
                joblib.dump(self.models[target], path)

    def _train_target(self, target: str) -> Pipeline:
        """
        训练单个目标变量的模型
        
        使用规则引擎生成训练数据。
        """
        from lib.data_generator import generate_training_data

        X, y = generate_training_data(n_scenarios=1000, seed=42)

        X_arr = np.array([build_features(SimulationParams(**x)) for x in X])
        y_arr = np.array([yi[target] for yi in y])

        pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("regressor", Ridge(alpha=1.0)),  # Ridge 回归，防止过拟合
        ])
        pipeline.fit(X_arr, y_arr)

        return pipeline

    @property
    def info(self) -> ModelInfo:
        return ModelInfo(
            id="linear",
            name="线性回归",
            model_type="传统ML",
            description="基于合成数据训练的线性模型，可解释性强",
            icon="📈",
            requires_gpu=False,
            estimated_latency_ms=10,
        )

    def simulate(
        self,
        params: SimulationParams,
        seed: Optional[int] = None,
    ) -> SimulationResult:
        """
        使用线性模型预测经营结果
        
        注意: 线性模型只预测汇总指标，每日趋势仍用规则引擎生成。
        这是冷启动方案，后续可训练时序模型替代。
        """
        # 用线性模型预测汇总指标
        features = build_features(params)
        predicted = {}
        for target, model in self.models.items():
            pred = model.predict(features.reshape(1, -1))[0]
            predicted[target] = max(0, pred)  # 确保非负

        # 用规则引擎生成每日趋势 (作为基线)
        rule_result = simulate_rule_engine(params, seed=seed if seed is not None else 42)

        # 调整汇总指标为 ML 预测值
        scale_profit = predicted["profit"] / rule_result.summary.profit if rule_result.summary.profit > 0 else 1.0
        scale_revenue = predicted["revenue"] / rule_result.summary.revenue if rule_result.summary.revenue > 0 else 1.0
        scale_cost = predicted["cost"] / rule_result.summary.cost if rule_result.summary.cost > 0 else 1.0

        # 缩放每日数据
        history = []
        total_revenue = 0
        total_cost = 0
        for d in rule_result.history:
            rev = d.revenue * scale_revenue
            cost = d.cost * scale_cost
            profit = rev - cost
            total_revenue += rev
            total_cost += cost

            history.append(DailyResult(
                day=d.day,
                active_users=d.active_users,
                revenue=round(rev, 2),
                cost=round(cost, 2),
                profit=round(profit, 2),
                cumulative_profit=round(total_revenue - total_cost, 2),
                calls=d.calls,
            ))

        ending_active = history[-1].active_users if history else 0
        retention = predicted["retention"]

        return SimulationResult(
            summary=SimulationSummary(
                revenue=round(total_revenue, 2),
                cost=round(total_cost, 2),
                profit=round(predicted["profit"], 2),
                retention=round(min(100, max(0, retention)), 1),
                active_users=ending_active,
                avg_revenue_per_user=round(total_revenue / params.user_count, 2) if params.user_count > 0 else 0,
                avg_cost_per_user=round(total_cost / params.user_count, 2) if params.user_count > 0 else 0,
                total_calls=rule_result.summary.total_calls,
                blended_cost=rule_result.summary.blended_cost,
            ),
            history=history,
        )

    def explain(self, params: SimulationParams, result: SimulationResult) -> str:
        """模型解释"""
        features = build_features(params)
        parts = ["基于线性回归模型推演："]

        # 显示每个目标变量的预测值
        for target in ["profit", "revenue", "cost", "retention"]:
            if target in self.models:
                pred = self.models[target].predict(features.reshape(1, -1))[0]
                if target == "profit":
                    parts.append(f"预测利润: ¥{pred:,.2f}")
                elif target == "retention":
                    parts.append(f"预测留存率: {pred:.1f}%")
                elif target == "revenue":
                    parts.append(f"预测收入: ¥{pred:,.2f}")
                elif target == "cost":
                    parts.append(f"预测成本: ¥{pred:,.2f}")

        parts.append("特征: 价格、免费额度、模型配比、质量目标、用户规模、天数")
        return "\n".join(parts)
