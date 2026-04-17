import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import generate

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)

app = FastAPI(
    title="Ankify AI Server",
    version="0.1.0",
    description="PDF to Anki flashcard generation powered by GPT-4o Vision",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        p.strip() for p in settings.cors_origins.split(",") if p.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "ankify-ai-server"}
