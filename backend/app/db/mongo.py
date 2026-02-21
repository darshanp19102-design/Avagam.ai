from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


@dataclass
class InsertOneResult:
    inserted_id: ObjectId


class InMemoryCursor:
    def __init__(self, docs: list[dict[str, Any]]):
        self.docs = docs

    def sort(self, key: str, direction: int):
        self.docs.sort(key=lambda d: d.get(key, datetime.min), reverse=direction < 0)
        return self

    def __aiter__(self):
        self._i = 0
        return self

    async def __anext__(self):
        if self._i >= len(self.docs):
            raise StopAsyncIteration
        item = self.docs[self._i]
        self._i += 1
        return dict(item)


class InMemoryCollection:
    def __init__(self):
        self.docs: list[dict[str, Any]] = []

    async def create_index(self, *_args, **_kwargs):
        return None

    async def find_one(self, query: dict):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return dict(doc)
        return None

    async def insert_one(self, doc: dict):
        new_doc = dict(doc)
        new_doc['_id'] = ObjectId()
        self.docs.append(new_doc)
        return InsertOneResult(inserted_id=new_doc['_id'])

    async def update_one(self, query: dict, update: dict):
        matched = 0
        modified = 0
        for idx, doc in enumerate(self.docs):
            if all(doc.get(k) == v for k, v in query.items()):
                matched = 1
                if '$set' in update and isinstance(update['$set'], dict):
                    self.docs[idx] = {**doc, **update['$set']}
                    modified = 1
                break

        class _Result:
            matched_count = matched
            modified_count = modified

        return _Result()

    def find(self, query: dict):
        out = [d for d in self.docs if all(d.get(k) == v for k, v in query.items())]
        return InMemoryCursor(out)

    async def count_documents(self, query: dict):
        return len([d for d in self.docs if all(d.get(k) == v for k, v in query.items())])


class InMemoryDB:
    def __init__(self):
        self._cols: dict[str, InMemoryCollection] = {}

    def __getitem__(self, name: str):
        if name not in self._cols:
            self._cols[name] = InMemoryCollection()
        return self._cols[name]


_db = None


def get_db():
    global _db
    if _db is not None:
        return _db
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI)
        _db = client[settings.MONGO_DB]
    except Exception:
        _db = InMemoryDB()
    return _db


async def init_db() -> None:
    db = get_db()
    try:
        await db.users.create_index('email', unique=True)
        await db.evaluations.create_index([('user_id', 1), ('created_at', -1)])
        await db.domain_use_cases.create_index([('user_id', 1), ('created_at', -1)])
        await db.company_use_cases.create_index([('user_id', 1), ('created_at', -1)])
        await db.email_logs.create_index([('user_id', 1), ('created_at', -1)])
    except Exception:
        pass


def collection(name: str):
    return get_db()[name]
