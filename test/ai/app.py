from fastapi import FastAPI

app = FastAPI(title="AI Placeholder Service")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/infer")
async def infer(payload: dict) -> dict:
    """Placeholder endpoint that simply echoes the received payload."""
    return {"received": payload}