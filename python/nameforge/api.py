from __future__ import annotations

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from .scoring import SUPPORTED_LANGUAGES, rank_candidates

app = FastAPI(title="NameForge Quality API", version="0.1.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("NAMEFORGE_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class RankRequest(BaseModel):
    candidates: list[str] = Field(min_length=1, max_length=100)
    language: str = Field(default="en", min_length=2, max_length=3)
    preferred_length: int | None = Field(default=None, ge=2, le=40)
    keyword: str = Field(default="", max_length=80)

    @field_validator("candidates")
    @classmethod
    def check_candidates(cls, values: list[str]) -> list[str]:
        if any(len(value) > 120 for value in values):
            raise ValueError("Each candidate must contain at most 120 characters.")
        return values

    @field_validator("language")
    @classmethod
    def check_language(cls, value: str) -> str:
        if value not in SUPPORTED_LANGUAGES:
            raise ValueError("Unsupported language code.")
        return value


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "nameforge-quality-api", "version": "0.1.0"}


@app.post("/v1/rank")
def rank(request: RankRequest) -> dict:
    try:
        results = rank_candidates(request.candidates, request.language, request.preferred_length, request.keyword)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return {
        "language": request.language,
        "count": len(results),
        "results": [
            {"name": item.name, "score": item.score, "reasons": list(item.reasons), "duplicate": item.duplicate}
            for item in results
        ],
    }


if __name__ == "__main__":
    uvicorn.run("nameforge.api:app", host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8000")))
