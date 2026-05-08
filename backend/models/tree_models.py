"""
随机森林模型

基于规则引擎生成的合成数据训练，能捕捉非线性关系，
并提供特征重要性分析。
"""

from __future__ import annotations

import os
import joblib
from typing import List, Dict, Any, Optional

import numpy as np
from sklearn.ensemble import RandomForestRegressor
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
# 特征工程（与 linear_model 共享）
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
    "profit": os.path.join(MODEL_DIR, "rf_profit_model.joblib"),
    "retention": os.path.join(MODEL_DIR, "rf_retention_model.joblib"),
    "revenue": os.path.join(MODEL_DIR, "rf_revenue_model.joblib"),
    "cost": os.path.join(MODEL_DIR, "rf_cost_model.joblib"),
}


class RandomForestModel(BaseModel):
    """随机森林模型"""

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
        训练单个目标变量的随机森林模型

        使用规则引擎生成训练数据。
        """
        from lib.data_generator import generate_training_data

        X, y = generate_training_data(n_scenarios=2000, seed=42)

        X_arr = np.array([build_features(SimulationParams(**x)) for x in X])
        y_arr = np.array([yi[target] for yi in y])

        pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("regressor", RandomForestRegressor(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1,
            )),
        ])
        pipeline.fit(X_arr, y_arr)

        return pipeline

    @property
    def info(self) -> ModelInfo:
        return ModelInfo(
            id="random_forest",
            name="随机森林",
            model_type="传统ML",
            description="基于合成数据训练的随机森林模型，捕捉非线性关系，提供特征重要性分析",
            icon="🌳",
            requires_gpu=False,
            estimated_latency_ms=30,
        )

    def _get_feature_importances(self) -> Dict[str, Dict[str, float]]:
        """
        获取每个目标变量的特征重要性

        Returns:
            {target: {feature_name: importance}}
        """
        importances = {}
        for target, pipeline in self.models.items():
            rf = pipeline.named_steps["regressor"]
            imp = rf.feature_importances_
            importances[target] = {
                name: float(round(imp[i], 4))
                for i, name in enumerate(FEATURE_NAMES)
            }
        return importances

    def simulate(
        self,
        params: SimulationParams,
        seed: Optional[int] = None,
    ) -> SimulationResult:
        """
        使用随机森林模型预测经营结果

        与 LinearModel 相同的策略：ML 预测汇总指标，规则引擎生成每日趋势。
        """
        # 用随机森林预测汇总指标
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
        """模型解释 — 包含特征重要性"""
        features = build_features(params)
        parts = ["基于随机森林模型推演："]

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

        # 特征重要性（以 profit 模型为例）
        if "profit" in self.models:
            rf = self.models["profit"].named_steps["regressor"]
            imp = rf.feature_importances_
            # 排序
            sorted_idx = np.argsort(imp)[::-1]
            parts.append("")
            parts.append("特征重要性 (利润预测):")
            for i, idx in enumerate(sorted_idx[:3]):
                parts.append(f"  {i+1}. {FEATURE_NAMES[idx]}: {imp[idx]:.1%}")

        parts.append("")
        parts.append("随机森林通过多棵决策树投票，能捕捉非线性关系和参数交互效应。")
        return "\n".join(parts)
