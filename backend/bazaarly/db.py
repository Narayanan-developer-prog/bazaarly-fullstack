from django.conf import settings
from pymongo import MongoClient

_client = None


def get_db():
    """Returns the MongoDB database handle, reusing one client for the app."""
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URI)
    return _client[settings.MONGO_DB_NAME]
