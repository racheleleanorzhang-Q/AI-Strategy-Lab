"""
模型训练脚本

训练所有 ML 模型的权重文件。
"""

from __future__ import annotations

import os
import sys
import time

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def train_linear_models():
    """训练线性回归模型"""
    print("🔄 训练线性回归模型...")
    start = time.time()

    from models.linear_model import LinearModel

    model = LinearModel()
    elapsed = time.time() - start

    print(f"✅ 线性回归模型训练完成，耗时 {elapsed:.1f}s")
    print(f"   模型目录: {os.path.join(os.path.dirname(__file__), 'models', 'weights')}")
    return model


def train_random_forest():
    """训练随机森林模型"""
    print("🔄 训练随机森林模型...")
    start = time.time()

    from models.tree_models import RandomForestModel

    model = RandomForestModel()
    elapsed = time.time() - start

    print(f"✅ 随机森林模型训练完成，耗时 {elapsed:.1f}s")
    return model


def train_lstm(n: int = 2000):
    """训练 LSTM 模型"""
    print(f"🔄 训练 LSTM 模型 ({n} 条时序数据)...")
    start = time.time()

    from models.lstm_model import train_lstm as _train_lstm

    stats = _train_lstm(n_scenarios=n)
    elapsed = time.time() - start

    print(f"✅ LSTM 模型训练完成，耗时 {elapsed:.1f}s")
    print(f"   最佳验证损失: {stats['best_val_loss']:.6f}")
    return stats


def train_transformer(n: int = 3000):
    """训练 Transformer 模型"""
    print(f"🔄 训练 Transformer 模型 ({n} 条数据)...")
    start = time.time()

    from models.transformer_model import train_transformer as _train_transformer

    stats = _train_transformer(n_scenarios=n)
    elapsed = time.time() - start

    print(f"✅ Transformer 模型训练完成，耗时 {elapsed:.1f}s")
    print(f"   最佳验证损失: {stats['best_val_loss']:.6f}")
    return stats


def generate_data(n: int = 10000):
    """生成训练数据"""
    print(f"🔄 生成 {n} 条合成训练数据...")
    start = time.time()

    from lib.data_generator import generate_training_data, save_training_data

    X, y = generate_training_data(n_scenarios=n, seed=42)
    filepath = save_training_data(X, y)
    elapsed = time.time() - start

    print(f"✅ 数据生成完成，耗时 {elapsed:.1f}s")
    print(f"   文件: {filepath}")
    print(f"   大小: {os.path.getsize(filepath) / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="训练策略模拟模型")
    parser.add_argument("--data-only", action="store_true", help="只生成数据，不训练模型")
    parser.add_argument("--model", type=str, default="all",
                        choices=["all", "linear", "random_forest", "lstm", "transformer"],
                        help="要训练的模型 (默认: all)")
    parser.add_argument("--n", type=int, default=10000, help="训练数据量")
    args = parser.parse_args()

    print("=" * 60)
    print("AI Strategy Lab — 模型训练")
    print("=" * 60)

    # 生成数据
    generate_data(args.n)

    if not args.data_only:
        # 安装依赖检查
        try:
            import sklearn
            print(f"\n✅ scikit-learn {sklearn.__version__} 已安装")
        except ImportError:
            print("\n⚠️  scikit-learn 未安装，正在安装...")
            import subprocess
            subprocess.run([sys.executable, "-m", "pip", "install", "scikit-learn", "joblib", "pandas", "-q"])

        try:
            import torch
            print(f"✅ torch {torch.__version__} 已安装")
        except ImportError:
            print("\n⚠️  torch 未安装，正在安装 (CPU 版本)...")
            import subprocess
            subprocess.run([
                sys.executable, "-m", "pip", "install",
                "torch", "--index-url", "https://download.pytorch.org/whl/cpu", "-q"
            ])

        # 训练模型
        model = args.model

        if model in ("all", "linear"):
            train_linear_models()
            print()

        if model in ("all", "random_forest"):
            train_random_forest()
            print()

        if model in ("all", "lstm"):
            train_lstm(n=args.n)
            print()

        if model in ("all", "transformer"):
            train_transformer(n=args.n)
            print()

    print("\n🎉 训练完成!")
