# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine

from routers.user_router import router as user_router
from routers.health_router import router as health_router
from routers.auth_router import router as auth_router
from routers.drug_router import router as drug_router
from routers.visit_router import router as visit_router
from routers.prescription_router import router as prescription_router
from routers.schedule_router import router as schedule_router

import os


Base.metadata.create_all(bind=engine)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4173")


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://10.0.2.2:5173",
        "http://localhost:4173",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "MediNote FastAPI 연결 성공 🚀"}

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(health_router)
app.include_router(drug_router)
app.include_router(visit_router)
app.include_router(prescription_router)
app.include_router(schedule_router)
