"""
AI Strategy Lab — 后端服务

FastAPI 应用入口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

app = FastAPI(
    title="AI Strategy Lab API",
    description="可插拔模型策略模拟台后端",
    version="0.2.0",
)

# ── CORS 配置 ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 注册路由 ──
app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "AI Strategy Lab API",
        "version": "0.2.0",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8100, reload=True)
