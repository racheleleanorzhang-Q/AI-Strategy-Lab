"""
API 路由

提供模型列表和模拟执行的 HTTP 接口。
"""

from __future__ import annotations

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
