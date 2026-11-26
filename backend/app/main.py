import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.errors import register_error_handlers
from app.routers import auth, clients, products, quotes

app = FastAPI(title="inq-hub API", version="0.1.0")
logger = logging.getLogger(__name__)
register_error_handlers(app)


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/docs")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
protected = [Depends(get_current_user)]
api_router.include_router(quotes.router, dependencies=protected)
api_router.include_router(clients.router, dependencies=protected)
api_router.include_router(products.router, dependencies=protected)


@api_router.get("/health", tags=["health"])
def health(db: Session = Depends(get_db)):
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Health: brak połączenia z bazą")
        return JSONResponse(
            status_code=503,
            content={"status": "DOWN", "database": "DISCONNECTED", "timestamp": timestamp},
        )
    return {"status": "UP", "database": "CONNECTED", "timestamp": timestamp}


@api_router.get("/version", tags=["health"])
def version() -> dict[str, str]:
    return {"version": settings.git_sha}


app.include_router(api_router)
