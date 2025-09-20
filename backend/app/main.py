from fastapi import FastAPI
from app.db import init_db
from app.routers import upload, documents, debate
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
app = FastAPI(title="Startup AI Backend")

@app.on_event("startup")
async def startup_event():
    await init_db()

app.include_router(upload.router)
app.include_router(documents.router)
app.include_router(debate.router)

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