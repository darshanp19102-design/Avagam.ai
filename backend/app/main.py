from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.evaluations import router as evaluations_router
from app.api.use_cases import router as use_cases_router
from app.core.config import settings
from app.db.mongo import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(title='Avagama.ai API', version='1.0.0', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(evaluations_router)
app.include_router(use_cases_router)


@app.get('/health')
async def health():
    return {'status': 'ok'}
