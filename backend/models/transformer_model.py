"""
Transformer 模型

基于注意力机制的深度模型，捕捉策略参数间的复杂交互关系。

用 Transformer Encoder 对策略参数序列进行编码，
通过自注意力学习参数间的交互模式。
"""

from __future__ import annotations

import os
import json
from typing import List, Dict, Any, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

from .base import (
    BaseModel,
    ModelInfo,
    SimulationParams,
    SimulationResult,
    SimulationSummary,
    DailyResult,
)
from .rule_engine import simulate_rule_engine

# ──────────────────────────────────────────────
# 超参数
# ──────────────────────────────────────────────

NUM_PARAMS = 6  # 原始策略参数数量
EMBED_DIM = 32
NUM_HEADS = 4
NUM_LAYERS = 2
DIM_FEEDFORWARD = 128
NUM_TARGETS = 4  # profit, retention, revenue, cost
DROPOUT = 0.15

BATCH_SIZE = 128
LEARNING_RATE = 0.001
NUM_EPOCHS = 80
PATIENCE = 12

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "weights")
WEIGHT_PATH = os.path.join(MODEL_DIR, "transformer_model.pt")
CONFIG_PATH = os.path.join(MODEL_DIR, "transformer_config.json")

DEVICE = torch.device("cpu")

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
]


def normalize_params(params: SimulationParams) -> np.ndarray:
    """
    归一化策略参数为 [0, 1] 范围
    """
    return np.array([
        params.price / 39.0,
        params.free_quota / 30.0,
        params.cheap_ratio,
        params.quality_target / 95.0,
        params.user_count / 2000.0,
        params.days / 30.0,
    ])


def build_features(params: SimulationParams) -> np.ndarray:
    """
    构建特征向量（含交互特征，与 linear_model 一致）
    """
    raw = np.array([
        params.price,
        params.free_quota,
        params.cheap_ratio,
        params.quality_target,
        params.user_count,
        params.days,
    ])
    # 交互特征
    interactions = np.array([
        params.price * params.free_quota,
        params.price * params.cheap_ratio,
        params.quality_target * params.cheap_ratio,
        params.user_count * params.days,
    ])
    return np.concatenate([raw, interactions])


# ──────────────────────────────────────────────
# Transformer 网络
# ──────────────────────────────────────────────

class PositionalEncoding(nn.Module):
    """位置编码"""

    def __init__(self, d_model: int, max_len: int = 10, dropout: float = 0.0):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model)
        )
        pe[:, 0::2] = torch.sin(position * div_term)
        if d_model % 2 == 1:
            pe[:, 1::2] = torch.cos(position * div_term[: d_model - 1])
        else:
            pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # [1, max_len, d_model]
        self.register_buffer("pe", pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: [batch, seq_len, d_model]
        """
        x = x + self.pe[:, : x.size(1), :]
        return self.dropout(x)


class StrategyTransformer(nn.Module):
    """
    策略 Transformer

    将每个策略参数视为一个 token，通过自注意力学习参数交互。
    """

    def __init__(
        self,
        num_params: int = NUM_PARAMS,
        embed_dim: int = EMBED_DIM,
        num_heads: int = NUM_HEADS,
        num_layers: int = NUM_LAYERS,
        dim_feedforward: int = DIM_FEEDFORWARD,
        num_targets: int = NUM_TARGETS,
        dropout: float = DROPOUT,
    ):
        super().__init__()

        # 输入投影: 标量 → embedding
        self.input_proj = nn.Linear(1, embed_dim)

        self.pos_encoding = PositionalEncoding(embed_dim, max_len=num_params + 1, dropout=dropout)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True,
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        # 输出头: mean pooling → MLP → targets
        self.output_head = nn.Sequential(
            nn.Linear(embed_dim, embed_dim * 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(embed_dim * 2, embed_dim),
            nn.ReLU(),
            nn.Linear(embed_dim, num_targets),
        )

        # 注意力权重 (用于解释)
        self._last_attention: Optional[torch.Tensor] = None

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: [batch, num_params] 归一化后的参数
        Returns:
            [batch, num_targets] 预测值
        """
        # 每个参数独立投影到 embedding
        # x: [batch, num_params] → [batch, num_params, 1] → [batch, num_params, embed_dim]
        x = x.unsqueeze(-1)
        x = self.input_proj(x)

        # 位置编码
        x = self.pos_encoding(x)

        # Transformer 编码
        encoder_output = self.transformer(x)

        # 保存最后一层注意力权重 (用于解释)
        # 获取注意力权重
        self._last_attention = None
        for layer in self.transformer.layers:
            # 尝试获取注意力权重
            if hasattr(layer, "self_attn"):
                # 注册 hook 获取注意力
                pass

        # Mean pooling
        pooled = encoder_output.mean(dim=1)  # [batch, embed_dim]

        # 输出
        return self.output_head(pooled)

    def get_attention_map(self, x: torch.Tensor) -> Optional[np.ndarray]:
        """
        获取注意力权重图 (用于解释)

        Returns:
            [num_params, num_params] 注意力权重矩阵
        """
        # 简化版: 使用梯度作为注意力近似
        x = x.unsqueeze(0).requires_grad_(True)  # [1, num_params]
        x = x.unsqueeze(-1)
        x_proj = self.input_proj(x)
        x_pe = self.pos_encoding(x_proj)
        encoder_out = self.transformer(x_pe)
        pooled = encoder_out.mean(dim=1)
        output = self.output_head(pooled)

        # 对第一个目标求梯度
        output[0, 0].backward()
        if x.grad is not None:
            # 归一化梯度作为重要性
            grad = x.grad.abs().squeeze().detach().numpy()
            grad_sum = grad.sum()
            if grad_sum > 0:
                grad = grad / grad_sum
            return grad

        return None


# ──────────────────────────────────────────────
# 数据集
# ──────────────────────────────────────────────

class StrategyDataset(Dataset):
    """策略参数 → 目标变量"""

    def __init__(
        self,
        X: List[Dict[str, Any]],
        y: List[Dict[str, float]],
    ):
        """
        Args:
            X: 策略参数列表
            y: 目标变量列表 (profit, retention, revenue, cost)
        """
        self.X = np.array([normalize_params(SimulationParams(**x)) for x in X])
        self.y = np.array([
            [yi["profit"], yi["retention"], yi["revenue"], yi["cost"]]
            for yi in y
        ])

        # 归一化目标
        self.y_mean = self.y.mean(axis=0)
        self.y_std = self.y.std(axis=0) + 1e-8
        self.y_normalized = (self.y - self.y_mean) / self.y_std

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return (
            torch.FloatTensor(self.X[idx]),
            torch.FloatTensor(self.y_normalized[idx]),
        )


# ──────────────────────────────────────────────
# 训练
# ──────────────────────────────────────────────

def train_transformer(
    n_scenarios: int = 3000,
    seed: int = 42,
    epochs: int = NUM_EPOCHS,
    patience: int = PATIENCE,
) -> Dict[str, Any]:
    """
    训练 Transformer 模型

    Returns:
        训练统计信息
    """
    from lib.data_generator import generate_training_data

    print("🔄 生成 Transformer 训练数据...")
    X, y = generate_training_data(n_scenarios=n_scenarios, seed=seed)

    # 划分训练/验证集
    np.random.seed(seed)
    indices = np.random.permutation(len(X))
    split = int(0.85 * len(indices))
    train_idx, val_idx = indices[:split], indices[split:]

    X_train = [X[i] for i in train_idx]
    y_train = [y[i] for i in train_idx]
    X_val = [X[i] for i in val_idx]
    y_val = [y[i] for i in val_idx]

    train_dataset = StrategyDataset(X_train, y_train)
    val_dataset = StrategyDataset(X_val, y_val)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # 初始化模型
    model = StrategyTransformer().to(DEVICE)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=5
    )

    # 训练循环
    best_val_loss = float("inf")
    best_state = None
    no_improve = 0
    train_history = []

    print(f"\n🚀 开始训练 Transformer (epoch={epochs}, patience={patience})")
    for epoch in range(1, epochs + 1):
        # 训练
        model.train()
        train_loss = 0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
            optimizer.zero_grad()
            pred = model(X_batch)
            loss = criterion(pred, y_batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += loss.item()

        train_loss /= len(train_loader)

        # 验证
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
                pred = model(X_batch)
                loss = criterion(pred, y_batch)
                val_loss += loss.item()

        val_loss /= len(val_loader)
        scheduler.step(val_loss)

        train_history.append({"epoch": epoch, "train_loss": train_loss, "val_loss": val_loss})

        if epoch % 10 == 0 or epoch == 1:
            lr = optimizer.param_groups[0]["lr"]
            print(f"  Epoch {epoch:3d}/{epochs}: train_loss={train_loss:.6f}, val_loss={val_loss:.6f}, lr={lr:.6f}")

        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            no_improve = 0
        else:
            no_improve += 1
            if no_improve >= patience:
                print(f"  ⏹️ Early stopping at epoch {epoch}")
                break

    # 加载最佳模型
    if best_state is not None:
        model.load_state_dict(best_state)

    # 保存模型
    os.makedirs(MODEL_DIR, exist_ok=True)
    torch.save({
        "model_state_dict": best_state or model.state_dict(),
        "y_mean": train_dataset.y_mean.tolist(),
        "y_std": train_dataset.y_std.tolist(),
        "num_params": NUM_PARAMS,
        "embed_dim": EMBED_DIM,
        "num_heads": NUM_HEADS,
        "num_layers": NUM_LAYERS,
    }, WEIGHT_PATH)

    config = {
        "n_scenarios": n_scenarios,
        "train_samples": len(train_dataset),
        "val_samples": len(val_dataset),
        "best_val_loss": float(best_val_loss),
        "epochs_trained": len(train_history),
    }
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)

    print(f"\n✅ Transformer 训练完成!")
    print(f"   最佳验证损失: {best_val_loss:.6f}")
    print(f"   训练轮数: {len(train_history)}")
    print(f"   权重保存: {WEIGHT_PATH}")

    return {
        "best_val_loss": float(best_val_loss),
        "epochs_trained": len(train_history),
        "history": train_history,
    }


# ──────────────────────────────────────────────
# 模型类
# ──────────────────────────────────────────────

class TransformerModel(BaseModel):
    """Transformer 模型"""

    def __init__(self):
        self.model = StrategyTransformer().to(DEVICE)
        self.y_mean = np.zeros(NUM_TARGETS)
        self.y_std = np.ones(NUM_TARGETS)
        self._load_or_train()

    def _load_or_train(self):
        """加载预训练模型或训练新模型"""
        if os.path.exists(WEIGHT_PATH):
            checkpoint = torch.load(WEIGHT_PATH, map_location=DEVICE, weights_only=True)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.y_mean = np.array(checkpoint.get("y_mean", [0, 0, 0, 0]))
            self.y_std = np.array(checkpoint.get("y_std", [1, 1, 1, 1]))
            print(f"  ✅ Transformer 模型已加载: {WEIGHT_PATH}")
        else:
            print("  ⚠️ 未找到 Transformer 权重，开始训练...")
            train_transformer()
            checkpoint = torch.load(WEIGHT_PATH, map_location=DEVICE, weights_only=True)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.y_mean = np.array(checkpoint.get("y_mean", [0, 0, 0, 0]))
            self.y_std = np.array(checkpoint.get("y_std", [1, 1, 1, 1]))

        self.model.eval()

    @property
    def info(self) -> ModelInfo:
        return ModelInfo(
            id="transformer",
            name="Transformer",
            model_type="深度学习",
            description="基于注意力机制的深度模型，捕捉策略参数间的复杂交互关系",
            icon="🧬",
            requires_gpu=False,
            estimated_latency_ms=3000,
        )

    def _predict(self, params: SimulationParams) -> Dict[str, float]:
        """
        预测汇总指标

        Returns:
            {profit, retention, revenue, cost}
        """
        features = normalize_params(params)
        x = torch.FloatTensor(features).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            pred_normalized = self.model(x)[0].cpu().numpy()

        # 反归一化
        pred = pred_normalized * self.y_std + self.y_mean

        return {
            "profit": max(0, pred[0]),
            "retention": min(100, max(0, pred[1])),
            "revenue": max(0, pred[2]),
            "cost": max(0, pred[3]),
        }

    def simulate(
        self,
        params: SimulationParams,
        seed: Optional[int] = None,
    ) -> SimulationResult:
        """
        使用 Transformer 预测经营结果

        与 LinearModel 相同的策略：ML 预测汇总指标，规则引擎生成每日趋势。
        """
        predicted = self._predict(params)

        # 用规则引擎生成每日趋势
        rule_result = simulate_rule_engine(params, seed=seed if seed is not None else 42)

        # 缩放每日数据
        scale_profit = predicted["profit"] / rule_result.summary.profit if rule_result.summary.profit > 0 else 1.0
        scale_revenue = predicted["revenue"] / rule_result.summary.revenue if rule_result.summary.revenue > 0 else 1.0
        scale_cost = predicted["cost"] / rule_result.summary.cost if rule_result.summary.cost > 0 else 1.0

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
                retention=round(retention, 1),
                active_users=ending_active,
                avg_revenue_per_user=round(total_revenue / params.user_count, 2) if params.user_count > 0 else 0,
                avg_cost_per_user=round(total_cost / params.user_count, 2) if params.user_count > 0 else 0,
                total_calls=rule_result.summary.total_calls,
                blended_cost=rule_result.summary.blended_cost,
            ),
            history=history,
        )

    def explain(self, params: SimulationParams, result: SimulationResult) -> str:
        """模型解释 — 展示注意力分析"""
        parts = ["基于 Transformer 模型推演："]

        # 预测值
        predicted = self._predict(params)
        parts.append(f"预测利润: ¥{predicted['profit']:,.2f}")
        parts.append(f"预测收入: ¥{predicted['revenue']:,.2f}")
        parts.append(f"预测成本: ¥{predicted['cost']:,.2f}")
        parts.append(f"预测留存率: {predicted['retention']:.1f}%")

        # 注意力分析
        features = normalize_params(params)
        x = torch.FloatTensor(features).to(DEVICE)
        importance = self.model.get_attention_map(x)

        if importance is not None:
            parts.append("")
            parts.append("参数重要性 (基于梯度分析):")
            sorted_idx = np.argsort(importance)[::-1]
            for i, idx in enumerate(sorted_idx[:3]):
                parts.append(f"  {i+1}. {FEATURE_NAMES[idx]}: {importance[idx]:.1%}")

        parts.append("")
        parts.append("Transformer 通过自注意力机制学习参数间的复杂交互，")
        parts.append("能捕捉规则引擎难以建模的非线性关系。")
        return "\n".join(parts)
