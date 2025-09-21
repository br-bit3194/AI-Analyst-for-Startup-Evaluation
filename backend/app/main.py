from fastapi import FastAPI, APIRouter
from app.db import init_db
from app.routers import upload, documents, debate, seed, finance, analysis, deal_analysis, alerts,ai_outputs,reports
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
# Create a parent router for all API routes
api_router = APIRouter(prefix="/api")

# Include all routers under the /api prefix
api_router.include_router(upload.router)
api_router.include_router(documents.router)
api_router.include_router(debate.router)
api_router.include_router(seed.router)
api_router.include_router(finance.router)
api_router.include_router(analysis.router)
api_router.include_router(deal_analysis.router)
api_router.include_router(alerts.router)
api_router.include_router(ai_outputs.router)
api_router.include_router(reports.router)

app = FastAPI(title="Startup AI Backend")

@app.on_event("startup")
async def startup_event():
    await init_db()

# Mount the API router
app.include_router(api_router)

# Add CORS (optional, helps with frontend testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler to capture 500 stacktraces
@app.exception_handler(Exception)
async def exception_handler(request: Request, exc: Exception):
    import traceback
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "traceback": traceback.format_exc()
        },
    )