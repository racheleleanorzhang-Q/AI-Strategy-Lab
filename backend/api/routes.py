"""
API 路由

提供模型列表和模拟执行的 HTTP 接口。
"""

from __future__ import annotations

import json
import math
import os
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel as PydanticBaseModel, Field
from typing import List, Dict, Any, Optional

from models.registry import list_models, get_model, simulate as engine_simulate
from models.base import SimulationParams

router = APIRouter(prefix="/api", tags=["simulation"])


# ──────────────────────────────────────────────
# 请求/响应模型
# ──────────────────────────────────────────────

class SimulateRequest(PydanticBaseModel):
    """模拟请求"""
    model: str = Field(..., description="模型 ID")
    params: Dict[str, Any] = Field(..., description="策略参数")


class SimulateResponse(PydanticBaseModel):
    """模拟响应"""
    model_config = {"protected_namespaces": ()}
    
    model_name: str = Field(..., description="模型名称")
    summary: Dict[str, Any] = Field(..., description="汇总指标")
    history: List[Dict[str, Any]] = Field(..., description="每日趋势")
    explanation: str = Field(..., description="模型解释")


class CompareRequest(PydanticBaseModel):
    """多模型对比请求"""
    models: List[str] = Field(..., description="模型 ID 列表")
    params: Dict[str, Any] = Field(..., description="策略参数")


class CompareResultItem(PydanticBaseModel):
    """单模型对比结果"""
    model_config = {"protected_namespaces": ()}
    
    model_id: str = Field(..., description="模型 ID")
    model_name: str = Field(..., description="模型名称")
    summary: Dict[str, Any] = Field(..., description="汇总指标")
    history: List[Dict[str, Any]] = Field(..., description="每日趋势")


class CompareResponse(PydanticBaseModel):
    """多模型对比响应"""
    results: List[CompareResultItem] = Field(..., description="各模型结果列表")


# ──────────────────────────────────────────────
# 路由
# ──────────────────────────────────────────────

@router.get("/models")
def get_available_models() -> List[Dict[str, Any]]:
    """
    获取所有可用模型列表
    
    Returns:
        模型元信息列表
    """
    models = list_models()
    return [m.to_dict() for m in models]


@router.post("/simulate")
def run_simulation(req: SimulateRequest) -> SimulateResponse:
    """
    执行策略模拟
    
    Args:
        req: 包含模型 ID 和策略参数的请求
    
    Returns:
        模拟结果 + 模型解释
    """
    try:
        # 获取模型
        model = get_model(req.model)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # 构建参数
    try:
        params = SimulationParams(**req.params)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid parameters: {str(e)}"
        )

    # 执行模拟
    try:
        result = model.simulate(params)
        explanation = model.explain(params, result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {str(e)}"
        )

    return SimulateResponse(
        model_name=model.info.name,
        summary=result.summary.__dict__,
        history=[d.__dict__ for d in result.history],
        explanation=explanation,
    )


@router.get("/health")
def health_check():
    """健康检查"""
    return {"status": "ok", "models": len(list_models())}


# ──────────────────────────────────────────────
# Step 5: 多模型对比
# ──────────────────────────────────────────────

@router.post("/compare")
def run_compare(req: CompareRequest) -> CompareResponse:
    """
    多模型对比 — 同一组参数在多个模型下运行
    
    Args:
        req: 包含模型 ID 列表和策略参数
    
    Returns:
        各模型的模拟结果列表
    """
    results = []
    for model_id in req.models:
        try:
            model = get_model(model_id)
            params = SimulationParams(**req.params)
            result = model.simulate(params)
            results.append(CompareResultItem(
                model_id=model_id,
                model_name=model.info.name,
                summary=result.summary.__dict__,
                history=[d.__dict__ for d in result.history],
            ))
        except ValueError:
            # 模型不存在，跳过
            continue
        except Exception as e:
            # 模型运行出错，记录错误但继续
            results.append(CompareResultItem(
                model_id=model_id,
                model_name=model_id,
                summary={"error": str(e)},
                history=[],
            ))
    return CompareResponse(results=results)


# ──────────────────────────────────────────────
# Step 5: 模型精度评估
# ──────────────────────────────────────────────

def _compute_mae(predicted: float, actual: float) -> float:
    return abs(predicted - actual)

def _compute_rmse(predicted: float, actual: float) -> float:
    return math.sqrt((predicted - actual) ** 2)

def _compute_mape(predicted: float, actual: float) -> float:
    if actual == 0:
        return 0.0
    return abs((predicted - actual) / actual) * 100

# 评估基准参数（平衡策略）
_EVAL_PARAMS = SimulationParams(
    name="评估基准",
    price=19, free_quota=12, cheap_ratio=0.65, quality_target=82,
    user_count=1200, days=30,
)

_WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "weights")

def _load_model_config(filename: str) -> Optional[Dict[str, Any]]:
    """加载模型配置文件"""
    path = os.path.join(_WEIGHTS_DIR, filename)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return None

def _get_file_info(filename: str) -> Optional[Dict[str, Any]]:
    """获取权重文件信息"""
    path = os.path.join(_WEIGHTS_DIR, filename)
    if os.path.exists(path):
        stat = os.stat(path)
        mtime = datetime.fromtimestamp(stat.st_mtime)
        return {
            "size_bytes": stat.st_size,
            "modified_date": mtime.strftime("%Y-%m-%d"),
        }
    return None

def _get_version_info(model_id: str) -> Optional[Dict[str, Any]]:
    """获取模型版本信息"""
    if model_id == "rule":
        return None
    
    # 深度学习模型：从 config JSON 读取
    if model_id == "lstm":
        config = _load_model_config("lstm_config.json")
        if config:
            file_info = _get_file_info("lstm_model.pt")
            return {
                "weights_file": "lstm_model.pt",
                "weights_size_bytes": file_info["size_bytes"] if file_info else 0,
                "training_date": file_info["modified_date"] if file_info else "unknown",
                "training_data_size": config.get("n_scenarios", 0),
                "val_loss": config.get("best_val_loss"),
            }
    
    if model_id == "transformer":
        config = _load_model_config("transformer_config.json")
        if config:
            file_info = _get_file_info("transformer_model.pt")
            return {
                "weights_file": "transformer_model.pt",
                "weights_size_bytes": file_info["size_bytes"] if file_info else 0,
                "training_date": file_info["modified_date"] if file_info else "unknown",
                "training_data_size": config.get("n_scenarios", 0),
                "val_loss": config.get("best_val_loss"),
            }
    
    # 传统ML 模型：从 joblib 文件读取
    ml_files = {
        "linear": ["profit_model.joblib", "retention_model.joblib", "revenue_model.joblib", "cost_model.joblib"],
        "random_forest": ["rf_profit_model.joblib", "rf_retention_model.joblib", "rf_revenue_model.joblib", "rf_cost_model.joblib"],
    }
    if model_id in ml_files:
        file_info = _get_file_info(ml_files[model_id][0])
        if file_info:
            return {
                "weights_file": ml_files[model_id][0],
                "weights_size_bytes": file_info["size_bytes"],
                "training_date": file_info["modified_date"],
                "training_data_size": None,
                "val_loss": None,
            }
    
    return None


@router.get("/evaluate")
def run_evaluation() -> Dict[str, Any]:
    """
    模型精度评估 — 所有模型与规则引擎基准对比
    
    Returns:
        各模型的 MAE/RMSE/MAPE 评估指标
    """
    # 1. 获取基准（规则引擎）结果
    try:
        baseline_model = get_model("rule")
        baseline_result = baseline_model.simulate(_EVAL_PARAMS)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Baseline simulation failed: {str(e)}")
    
    baseline_summary = baseline_result.summary
    
    # 2. 对每个非规则引擎模型进行评估
    metrics_list = []
    metrics_to_compare = ["profit", "retention", "revenue", "cost"]
    baseline_values = {
        "profit": baseline_summary.profit,
        "retention": baseline_summary.retention,
        "revenue": baseline_summary.revenue,
        "cost": baseline_summary.cost,
    }
    
    for model_info in list_models():
        if model_info.id == "rule":
            continue  # 跳过基准模型
        
        try:
            model = get_model(model_info.id)
            result = model.simulate(_EVAL_PARAMS)
            pred = result.summary
            
            # 计算各指标误差
            model_metrics = {}
            mae_values = []
            for metric_name in metrics_to_compare:
                predicted_val = getattr(pred, metric_name)
                actual_val = baseline_values[metric_name]
                mae = _compute_mae(predicted_val, actual_val)
                rmse = _compute_rmse(predicted_val, actual_val)
                mape = _compute_mape(predicted_val, actual_val)
                model_metrics[metric_name] = {
                    "mae": round(mae, 2),
                    "rmse": round(rmse, 2),
                    "mape_pct": round(mape, 2),
                }
                mae_values.append(mae)
            
            avg_mae = sum(mae_values) / len(mae_values) if mae_values else 0
            
            # 获取版本信息
            version_info = _get_version_info(model_info.id)
            training_data_size = version_info["training_data_size"] if version_info and version_info.get("training_data_size") else None
            training_date = version_info["training_date"] if version_info else None
            
            metrics_list.append({
                "model_id": model_info.id,
                "model_name": model_info.name,
                "metrics": model_metrics,
                "avg_mae": round(avg_mae, 2),
                "training_data_size": training_data_size,
                "training_date": training_date or "unknown",
            })
        except Exception as e:
            # 模型运行失败，记录错误
            metrics_list.append({
                "model_id": model_info.id,
                "model_name": model_info.name,
                "metrics": {},
                "avg_mae": None,
                "training_data_size": None,
                "training_date": None,
                "error": str(e),
            })
    
    return {
        "baseline": "rule",
        "baseline_summary": baseline_summary.__dict__,
        "metrics": metrics_list,
    }


# ──────────────────────────────────────────────
# Step 5: 模型详细信息（含版本）
# ──────────────────────────────────────────────

@router.get("/models/{model_id}/info")
def get_model_detail(model_id: str) -> Dict[str, Any]:
    """
    获取模型详细信息，包含训练元数据
    
    Args:
        model_id: 模型 ID
    
    Returns:
        模型元信息 + 版本信息
    """
    try:
        model = get_model(model_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    info = model.info.to_dict()
    version = _get_version_info(model_id)
    info["version"] = version
    
    return info
