from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.learn import router as learn_router
from backend.routes.upload import router as upload_router


app = FastAPI(
    title="Synapse AI API",
    version="1.0.0",
    description="Adaptive multi-agent learning for Arc Night 2026.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learn_router)
app.include_router(upload_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"name": "Synapse AI", "status": "ready", "docs": "/docs"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

