"""
合成数据生成管道

用规则引擎批量生成不同策略参数下的模拟结果，作为 ML 模型的训练数据。
"""

from __future__ import annotations

import random
from dataclasses import asdict
from typing import List, Dict, Any, Tuple

import numpy as np

from models.rule_engine import simulate_rule_engine
from models.base import SimulationParams


def random_strategy_params(rng: random.Random | None = None) -> SimulationParams:
    """
    随机生成一组策略参数
    
    在合理的业务范围内均匀采样。
    """
    if rng is None:
        rng = random.Random()

    return SimulationParams(
        name=f"策略_{rng.randint(1000, 9999)}",
        price=round(rng.uniform(5, 39), 1),
        free_quota=rng.randint(0, 30),
        cheap_ratio=round(rng.uniform(0, 1), 3),
        quality_target=round(rng.uniform(60, 95), 1),
        user_count=rng.choice([300, 500, 800, 1000, 1200, 1500, 2000]),
        days=rng.choice([7, 14, 21, 30]),
    )


def generate_training_data(
    n_scenarios: int = 10000,
    seed: int = 42,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, float]]]:
    """
    用规则引擎生成合成训练数据
    
    Args:
        n_scenarios: 生成的场景数量
        seed: 随机种子
    
    Returns:
        (X, y): 特征列表和目标列表
        每个 X[i] 包含策略参数
        每个 y[i] 包含目标变量 (profit, retention, revenue, cost)
    """
    rng = random.Random(seed)
    
    X: List[Dict[str, Any]] = []
    y: List[Dict[str, float]] = []

    for i in range(n_scenarios):
        params = random_strategy_params(rng)
        result = simulate_rule_engine(params, seed=rng.randint(0, 100000))

        # 特征: 策略参数
        X.append({
            "price": params.price,
            "free_quota": params.free_quota,
            "cheap_ratio": params.cheap_ratio,
            "quality_target": params.quality_target,
            "user_count": params.user_count,
            "days": params.days,
        })

        # 目标: 经营结果
        y.append({
            "profit": result.summary.profit,
            "retention": result.summary.retention,
            "revenue": result.summary.revenue,
            "cost": result.summary.cost,
            "total_calls": result.summary.total_calls,
        })

    return X, y


def save_training_data(
    X: List[Dict[str, Any]],
    y: List[Dict[str, float]],
    output_dir: str = "data",
    prefix: str = "synthetic",
) -> str:
    """
    保存训练数据到 JSON 文件
    
    Returns:
        保存的文件路径
    """
    import os
    import json

    os.makedirs(output_dir, exist_ok=True)

    # 合并 X 和 y
    data = []
    for x, y_item in zip(X, y):
        record = {**x, **y_item}
        data.append(record)

    filepath = os.path.join(output_dir, f"{prefix}_training_data.json")
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)

    return filepath


def load_training_data(filepath: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, float]]]:
    """
    从 JSON 文件加载训练数据
    
    Returns:
        (X, y): 特征列表和目标列表
    """
    import json

    with open(filepath, "r") as f:
        data = json.load(f)

    X = []
    y = []
    for record in data:
        X.append({
            "price": record["price"],
            "free_quota": record["free_quota"],
            "cheap_ratio": record["cheap_ratio"],
            "quality_target": record["quality_target"],
            "user_count": record["user_count"],
            "days": record["days"],
        })
        y.append({
            "profit": record["profit"],
            "retention": record["retention"],
            "revenue": record["revenue"],
            "cost": record["cost"],
            "total_calls": record["total_calls"],
        })

    return X, y


if __name__ == "__main__":
    import time

    print("🔄 开始生成合成训练数据...")
    start = time.time()

    n = 10000
    X, y = generate_training_data(n_scenarios=n, seed=42)

    elapsed = time.time() - start
    print(f"✅ 生成 {n} 条数据，耗时 {elapsed:.1f}s")
    print(f"   平均每条: {elapsed/n*1000:.1f}ms")

    # 保存
    filepath = save_training_data(X, y)
    print(f"✅ 数据已保存到: {filepath}")
    print(f"   文件大小: {os.path.getsize(filepath) / 1024 / 1024:.1f} MB")
