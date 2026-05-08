"""
LSTM 时序模型

基于时序神经网络的预测模型，捕捉经营动态变化趋势。

采用聚合模式（按用户分群预测，非个体），
用规则引擎生成的每日时间序列数据训练 LSTM。
"""

from __future__ import annotations

import os
import json
import random
from dataclasses import asdict
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

HIDDEN_SIZE = 64
NUM_LAYERS = 2
DROPOUT = 0.2
INPUT_FEATURES = 8  # 6 params + day_index + position
OUTPUT_FEATURES = 3  # active_users, revenue, cost
MAX_DAYS = 30
BATCH_SIZE = 64
LEARNING_RATE = 0.001
NUM_EPOCHS = 50
PATIENCE = 8  # Early stopping

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "weights")
WEIGHT_PATH = os.path.join(MODEL_DIR, "lstm_model.pt")
CONFIG_PATH = os.path.join(MODEL_DIR, "lstm_config.json")

DEVICE = torch.device("cpu")


# ──────────────────────────────────────────────
# LSTM 网络
# ──────────────────────────────────────────────

class LSTMNet(nn.Module):
    """LSTM 时序预测网络"""

    def __init__(
        self,
        input_size: int = INPUT_FEATURES,
        hidden_size: int = HIDDEN_SIZE,
        num_layers: int = NUM_LAYERS,
        output_size: int = OUTPUT_FEATURES,
        dropout: float = DROPOUT,
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout,
            batch_first=True,
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, output_size),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: [batch, seq_len, input_size]
        Returns:
            [batch, seq_len, output_size]
        """
        lstm_out, _ = self.lstm(x)
        return self.fc(lstm_out)


# ──────────────────────────────────────────────
# 数据集
# ──────────────────────────────────────────────

class TimeSeriesDataset(Dataset):
    """时序数据集 — 从规则引擎生成的每日数据构建"""

    def __init__(self, sequences: List[Dict[str, np.ndarray]]):
        """
        Args:
            sequences: 列表, 每个元素包含:
                - "X": [seq_len, input_features]
                - "y": [seq_len, output_features] (active_users, revenue, cost)
                - "length": int (实际天数, 用于 mask)
        """
        self.sequences = sequences

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, idx):
        seq = self.sequences[idx]
        return (
            torch.FloatTensor(seq["X"]),
            torch.FloatTensor(seq["y"]),
            torch.LongTensor([seq["length"]])[0],
        )


def build_time_series_from_rule_engine(
    params: SimulationParams,
    seed: int = 42,
) -> Optional[Dict[str, np.ndarray]]:
    """
    从规则引擎生成结果构建时序数据

    Returns:
        {"X": ..., "y": ..., "length": ...} 或 None (如果模拟失败)
    """
    result = simulate_rule_engine(params, seed=seed)

    if not result.history:
        return None

    seq_len = len(result.history)
    X_list = []
    y_list = []

    for i, daily in enumerate(result.history):
        # 特征: 6 个策略参数 + 当前天数 + 进度比例
        day_idx = (i + 1) / MAX_DAYS  # 归一化天数
        progress = i / max(seq_len - 1, 1)  # 0 到 1

        features = np.array([
            params.price / 39.0,          # 归一化
            params.free_quota / 30.0,
            params.cheap_ratio,
            params.quality_target / 95.0,
            params.user_count / 2000.0,
            params.days / 30.0,
            day_idx,
            progress,
        ])
        X_list.append(features)

        # 目标: active_users, revenue, cost (归一化)
        y_list.append(np.array([
            daily.active_users / params.user_count,
            daily.revenue / max(params.user_count * 0.5, 1),
            daily.cost / max(params.user_count * 0.3, 1),
        ]))

    X = np.array(X_list)
    y = np.array(y_list)

    # 填充到 MAX_DAYS
    if seq_len < MAX_DAYS:
        pad_size = MAX_DAYS - seq_len
        X = np.pad(X, ((0, pad_size), (0, 0)), mode="constant")
        y = np.pad(y, ((0, pad_size), (0, 0)), mode="constant")

    return {"X": X, "y": y, "length": seq_len}


def generate_training_sequences(
    n_scenarios: int = 2000,
    seed: int = 42,
) -> List[Dict[str, np.ndarray]]:
    """
    生成训练时序数据

    用规则引擎随机生成不同策略参数，构建时序数据集。
    """
    from lib.data_generator import random_strategy_params

    rng = random.Random(seed)
    sequences = []

    for i in range(n_scenarios):
        params = random_strategy_params(rng)
        seq = build_time_series_from_rule_engine(params, seed=rng.randint(0, 100000))
        if seq is not None:
            sequences.append(seq)

        if (i + 1) % 500 == 0:
            print(f"  生成进度: {i+1}/{n_scenarios} (有效: {len(sequences)})")

    print(f"  ✅ 共生成 {len(sequences)} 条有效时序数据")
    return sequences


# ──────────────────────────────────────────────
# 训练
# ──────────────────────────────────────────────

def train_lstm(
    n_scenarios: int = 2000,
    seed: int = 42,
    epochs: int = NUM_EPOCHS,
    patience: int = PATIENCE,
) -> Dict[str, Any]:
    """
    训练 LSTM 模型

    Returns:
        训练统计信息
    """
    print("🔄 生成 LSTM 训练时序数据...")
    sequences = generate_training_sequences(n_scenarios=n_scenarios, seed=seed)

    if len(sequences) < 100:
        raise RuntimeError(f"有效数据太少 ({len(sequences)}), 无法训练")

    # 划分训练/验证集
    np.random.seed(seed)
    indices = np.random.permutation(len(sequences))
    split = int(0.85 * len(indices))
    train_idx, val_idx = indices[:split], indices[split:]

    train_dataset = TimeSeriesDataset([sequences[i] for i in train_idx])
    val_dataset = TimeSeriesDataset([sequences[i] for i in val_idx])

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # 初始化模型
    model = LSTMNet().to(DEVICE)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=3
    )

    # 训练循环
    best_val_loss = float("inf")
    best_state = None
    no_improve = 0
    train_history = []

    print(f"\n🚀 开始训练 LSTM (epoch={epochs}, patience={patience})")
    for epoch in range(1, epochs + 1):
        # 训练
        model.train()
        train_loss = 0
        for X_batch, y_batch, lengths in train_loader:
            X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
            optimizer.zero_grad()
            pred = model(X_batch)

            # Mask padding
            mask = torch.arange(MAX_DAYS, device=DEVICE).unsqueeze(0) < lengths.unsqueeze(1)
            mask = mask.unsqueeze(2).expand(-1, -1, OUTPUT_FEATURES)
            loss = criterion(pred[mask], y_batch[mask])
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += loss.item()

        train_loss /= len(train_loader)

        # 验证
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for X_batch, y_batch, lengths in val_loader:
                X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
                pred = model(X_batch)
                mask = torch.arange(MAX_DAYS, device=DEVICE).unsqueeze(0) < lengths.unsqueeze(1)
                mask = mask.unsqueeze(2).expand(-1, -1, OUTPUT_FEATURES)
                loss = criterion(pred[mask], y_batch[mask])
                val_loss += loss.item()

        val_loss /= len(val_loader)
        scheduler.step(val_loss)

        train_history.append({"epoch": epoch, "train_loss": train_loss, "val_loss": val_loss})

        if epoch % 5 == 0 or epoch == 1:
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
        "input_size": INPUT_FEATURES,
        "hidden_size": HIDDEN_SIZE,
        "num_layers": NUM_LAYERS,
        "output_size": OUTPUT_FEATURES,
    }, WEIGHT_PATH)

    config = {
        "n_scenarios": n_scenarios,
        "train_sequences": len(train_dataset),
        "val_sequences": len(val_dataset),
        "best_val_loss": float(best_val_loss),
        "epochs_trained": len(train_history),
    }
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)

    print(f"\n✅ LSTM 训练完成!")
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

class LSTMModel(BaseModel):
    """LSTM 时序模型"""

    def __init__(self):
        self.model: LSTMNet = LSTMNet().to(DEVICE)
        self._load_or_train()

    def _load_or_train(self):
        """加载预训练模型或训练新模型"""
        if os.path.exists(WEIGHT_PATH):
            checkpoint = torch.load(WEIGHT_PATH, map_location=DEVICE, weights_only=True)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            print(f"  ✅ LSTM 模型已加载: {WEIGHT_PATH}")
        else:
            print("  ⚠️ 未找到 LSTM 权重，开始训练...")
            train_lstm()
            checkpoint = torch.load(WEIGHT_PATH, map_location=DEVICE, weights_only=True)
            self.model.load_state_dict(checkpoint["model_state_dict"])

        self.model.eval()

    @property
    def info(self) -> ModelInfo:
        return ModelInfo(
            id="lstm",
            name="LSTM时序",
            model_type="深度学习",
            description="基于时序神经网络的预测模型，捕捉经营动态变化趋势",
            icon="🔮",
            requires_gpu=False,
            estimated_latency_ms=2000,
        )

    def _predict_sequence(
        self,
        params: SimulationParams,
    ) -> Tuple[np.ndarray, int]:
        """
        预测时序数据

        Returns:
            (predictions, actual_length)
            predictions: [seq_len, output_features] 原始尺度的预测
        """
        seq_len = params.days

        # 构建输入序列
        X_list = []
        for i in range(seq_len):
            day_idx = (i + 1) / MAX_DAYS
            progress = i / max(seq_len - 1, 1)

            features = np.array([
                params.price / 39.0,
                params.free_quota / 30.0,
                params.cheap_ratio,
                params.quality_target / 95.0,
                params.user_count / 2000.0,
                params.days / 30.0,
                day_idx,
                progress,
            ])
            X_list.append(features)

        X = np.array(X_list)

        # 填充到 MAX_DAYS
        if seq_len < MAX_DAYS:
            pad_size = MAX_DAYS - seq_len
            X = np.pad(X, ((0, pad_size), (0, 0)), mode="constant")

        X_tensor = torch.FloatTensor(X).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            pred = self.model(X_tensor)[0].cpu().numpy()

        # 反归一化
        pred_users = pred[:seq_len, 0] * params.user_count
        pred_revenue = pred[:seq_len, 1] * max(params.user_count * 0.5, 1)
        pred_cost = pred[:seq_len, 2] * max(params.user_count * 0.3, 1)

        # 确保非负
        pred_users = np.maximum(pred_users, 0)
        pred_revenue = np.maximum(pred_revenue, 0)
        pred_cost = np.maximum(pred_cost, 0)

        # 取整 active_users
        pred_users = np.round(pred_users).astype(int)

        return np.column_stack([pred_users, pred_revenue, pred_cost]), seq_len

    def simulate(
        self,
        params: SimulationParams,
        seed: Optional[int] = None,
    ) -> SimulationResult:
        """
        使用 LSTM 预测每日经营数据

        直接预测每日 active_users, revenue, cost，
        然后计算汇总指标。
        """
        predictions, seq_len = self._predict_sequence(params)

        history = []
        total_revenue = 0.0
        total_cost = 0.0

        # 估算每日调用次数 (基于 revenue 和 blended cost)
        cheap_model_cost = 0.002
        expensive_model_cost = 0.02
        blended_cost = (
            params.cheap_ratio * cheap_model_cost
            + (1 - params.cheap_ratio) * expensive_model_cost
        )

        for i in range(seq_len):
            active_users = int(predictions[i, 0])
            revenue = float(predictions[i, 1])
            cost = float(predictions[i, 2])
            profit = revenue - cost

            # 估算调用次数
            calls = int(cost / blended_cost) if blended_cost > 0 else 0

            total_revenue += revenue
            total_cost += cost

            history.append(DailyResult(
                day=i + 1,
                active_users=active_users,
                revenue=round(revenue, 2),
                cost=round(cost, 2),
                profit=round(profit, 2),
                cumulative_profit=round(total_revenue - total_cost, 2),
                calls=calls,
            ))

        ending_active = history[-1].active_users if history else 0
        retention = (ending_active / params.user_count * 100) if params.user_count > 0 else 0

        return SimulationResult(
            summary=SimulationSummary(
                revenue=round(total_revenue, 2),
                cost=round(total_cost, 2),
                profit=round(total_revenue - total_cost, 2),
                retention=round(min(100, max(0, retention)), 1),
                active_users=ending_active,
                avg_revenue_per_user=round(total_revenue / params.user_count, 2) if params.user_count > 0 else 0,
                avg_cost_per_user=round(total_cost / params.user_count, 2) if params.user_count > 0 else 0,
                total_calls=sum(h.calls for h in history),
                blended_cost=round(blended_cost, 4),
            ),
            history=history,
        )

    def explain(self, params: SimulationParams, result: SimulationResult) -> str:
        """模型解释 — 展示时序趋势"""
        parts = ["基于 LSTM 时序模型推演："]

        # 关键指标
        parts.append(f"预测利润: ¥{result.summary.profit:,.2f}")
        parts.append(f"预测收入: ¥{result.summary.revenue:,.2f}")
        parts.append(f"预测成本: ¥{result.summary.cost:,.2f}")
        parts.append(f"预测留存率: {result.summary.retention}%")

        # 趋势分析
        if len(result.history) >= 7:
            first_week = result.history[:7]
            last_week = result.history[-7:]

            avg_active_first = np.mean([d.active_users for d in first_week])
            avg_active_last = np.mean([d.active_users for d in last_week])
            change = (avg_active_last - avg_active_first) / max(avg_active_first, 1) * 100

            if change > 5:
                trend = "上升"
            elif change < -5:
                trend = "下降"
            else:
                trend = "平稳"

            parts.append(f"")
            parts.append(f"活跃用户趋势: {trend} ({change:+.1f}%)")
            parts.append(f"首周均活: {avg_active_first:.0f} 人 → 末周均活: {avg_active_last:.0f} 人")

        parts.append("")
        parts.append("LSTM 通过时序记忆捕捉经营动态，适合分析长期趋势变化。")
        return "\n".join(parts)
