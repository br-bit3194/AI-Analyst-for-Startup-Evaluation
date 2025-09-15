from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings
from app.models import DocumentModel, DebateSession

def _get_db_name_from_uri(uri: str) -> str:
    if not uri:
        return "startup_ai"
    # strip query params
    uri_no_q = uri.split('?', 1)[0]
    # if last slash contains a db name, return it
    if '/' in uri_no_q:
        candidate = uri_no_q.rsplit('/', 1)[-1]
        if candidate:
            return candidate
    return "startup_ai"

client = AsyncIOMotorClient(settings.mongo_uri)
db_name = _get_db_name_from_uri(settings.mongo_uri)
db = client[db_name]

async def init_db(app=None):
    # initialize beanie with Document models
    await init_beanie(database=db, document_models=[DocumentModel, DebateSession])
