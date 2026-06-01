"""
Adaptateur MongoDB-compatible sur SQLite + aiosqlite.
Remplace motor/AsyncIOMotorClient sans changer server.py.
"""
import json
import os
import re
import uuid
import asyncio
import aiosqlite
from typing import Any, Dict, List, Optional


# ─── Helpers filtres / update / projection ────────────────────────────────

def _get(doc: dict, key: str) -> Any:
    """Accès valeur avec support notation pointée."""
    val = doc
    for part in key.split("."):
        if not isinstance(val, dict):
            return None
        val = val.get(part)
    return val


def _match(doc: dict, f: dict) -> bool:
    """Évalue un filtre MongoDB-style sur un dict Python."""
    for key, cond in f.items():
        if key == "$or":
            if not any(_match(doc, sub) for sub in cond):
                return False
            continue
        if key == "$and":
            if not all(_match(doc, sub) for sub in cond):
                return False
            continue
        val = _get(doc, key)
        if isinstance(cond, dict):
            for op, operand in cond.items():
                if op == "$options":
                    continue
                if op == "$eq":
                    if val != operand:
                        return False
                elif op == "$ne":
                    if val == operand:
                        return False
                elif op == "$gt":
                    if val is None or val <= operand:
                        return False
                elif op == "$gte":
                    if val is None or val < operand:
                        return False
                elif op == "$lt":
                    if val is None or val >= operand:
                        return False
                elif op == "$lte":
                    if val is None or val > operand:
                        return False
                elif op == "$in":
                    if val not in operand:
                        return False
                elif op == "$nin":
                    if val in operand:
                        return False
                elif op == "$exists":
                    exists = key in doc
                    if operand != exists:
                        return False
                elif op == "$regex":
                    flags = re.IGNORECASE if "i" in cond.get("$options", "") else 0
                    if val is None or not re.search(operand, str(val), flags):
                        return False
        else:
            if val != cond:
                return False
    return True


def _project(doc: dict, proj: Optional[dict]) -> dict:
    if not proj:
        return doc
    include = {k for k, v in proj.items() if v == 1 and k != "_id"}
    exclude = {k for k, v in proj.items() if v == 0}
    if include:
        out = {k: doc[k] for k in include if k in doc}
        if proj.get("_id") != 0 and "_id" in doc:
            out["_id"] = doc["_id"]
        return out
    return {k: v for k, v in doc.items() if k not in exclude}


def _apply_update(doc: dict, upd: dict) -> dict:
    doc = dict(doc)
    if "$set" in upd:
        doc.update(upd["$set"])
    if "$unset" in upd:
        for k in upd["$unset"]:
            doc.pop(k, None)
    if "$inc" in upd:
        for k, v in upd["$inc"].items():
            doc[k] = (doc.get(k) or 0) + v
    return doc


def _eval_cond(expr, doc: dict) -> Any:
    if isinstance(expr, list) and len(expr) == 3:
        cond, then_, else_ = expr
        if isinstance(cond, dict) and "$eq" in cond:
            a, b = cond["$eq"]
            a = doc.get(a[1:]) if isinstance(a, str) and a.startswith("$") else a
            b = doc.get(b[1:]) if isinstance(b, str) and b.startswith("$") else b
            result = a == b
        else:
            result = bool(cond)
        val = then_ if result else else_
        return doc.get(val[1:], 0) if isinstance(val, str) and val.startswith("$") else (val or 0)
    return 0


def _run_group(docs: list, spec: dict) -> list:
    id_expr = spec["_id"]
    groups: Dict[Any, dict] = {}
    for doc in docs:
        if id_expr is None:
            key = None
        elif isinstance(id_expr, str) and id_expr.startswith("$"):
            key = _get(doc, id_expr[1:])
        else:
            key = id_expr

        if key not in groups:
            groups[key] = {"_id": key}
            for out, acc in spec.items():
                if out == "_id":
                    continue
                if isinstance(acc, dict):
                    if "$sum" in acc:
                        groups[key][out] = 0
                    elif "$first" in acc:
                        groups[key][out] = None
                    elif "$push" in acc:
                        groups[key][out] = []

        for out, acc in spec.items():
            if out == "_id":
                continue
            if not isinstance(acc, dict):
                continue
            if "$sum" in acc:
                s = acc["$sum"]
                if isinstance(s, (int, float)):
                    groups[key][out] = groups[key].get(out, 0) + s
                elif isinstance(s, str) and s.startswith("$"):
                    v = _get(doc, s[1:]) or 0
                    groups[key][out] = groups[key].get(out, 0) + (v if isinstance(v, (int, float)) else 0)
                elif isinstance(s, dict) and "$cond" in s:
                    groups[key][out] = groups[key].get(out, 0) + _eval_cond(s["$cond"], doc)
            elif "$first" in acc:
                if groups[key].get(out) is None:
                    fexpr = acc["$first"]
                    groups[key][out] = _get(doc, fexpr[1:]) if isinstance(fexpr, str) and fexpr.startswith("$") else fexpr
            elif "$push" in acc:
                pexpr = acc["$push"]
                groups[key][out].append(_get(doc, pexpr[1:]) if isinstance(pexpr, str) and pexpr.startswith("$") else pexpr)
    return list(groups.values())


# ─── Résultats ────────────────────────────────────────────────────────────

class UpdateResult:
    def __init__(self, matched: int, modified: int = 0):
        self.matched_count = matched
        self.modified_count = modified


class DeleteResult:
    def __init__(self, deleted: int):
        self.deleted_count = deleted


# ─── Cursor ──────────────────────────────────────────────────────────────

class Cursor:
    def __init__(self, collection: "Collection", flt: Optional[dict], proj: Optional[dict]):
        self._col = collection
        self._flt = flt
        self._proj = proj
        self._sorts: list = []
        self._lim: Optional[int] = None
        self._skip: int = 0

    def sort(self, key, direction=1):
        if isinstance(key, str):
            self._sorts = [(key, direction)]
        elif isinstance(key, list):
            self._sorts = list(key)
        return self

    def limit(self, n: int):
        self._lim = n
        return self

    def skip(self, n: int):
        self._skip = n
        return self

    async def _docs(self) -> list:
        all_docs = await self._col._load()
        result = [_project(d, self._proj) for d in all_docs if self._flt is None or _match(d, self._flt)]
        for k, direction in reversed(self._sorts):
            result.sort(key=lambda d: (d.get(k) is None, d.get(k) if d.get(k) is not None else ""), reverse=(direction == -1))
        if self._skip:
            result = result[self._skip:]
        if self._lim is not None:
            result = result[:self._lim]
        return result

    async def to_list(self, length: Optional[int] = None) -> list:
        docs = await self._docs()
        return docs[:length] if length is not None else docs

    async def __aiter__(self):
        for doc in await self._docs():
            yield doc


# ─── Aggregate Cursor ────────────────────────────────────────────────────

class AggregateCursor:
    def __init__(self, collection: "Collection", pipeline: list):
        self._col = collection
        self._pipeline = pipeline

    async def _run(self) -> list:
        docs = await self._col._load()
        result = list(docs)
        for stage in self._pipeline:
            if "$match" in stage:
                result = [d for d in result if _match(d, stage["$match"])]
            elif "$group" in stage:
                result = _run_group(result, stage["$group"])
            elif "$sort" in stage:
                for k, direction in reversed(list(stage["$sort"].items())):
                    result.sort(key=lambda d: (d.get(k) is None, d.get(k) if d.get(k) is not None else 0), reverse=(direction == -1))
            elif "$limit" in stage:
                result = result[:stage["$limit"]]
            elif "$skip" in stage:
                result = result[stage["$skip"]:]
        return result

    async def to_list(self, length: Optional[int] = None) -> list:
        docs = await self._run()
        return docs[:length] if length is not None else docs

    async def __aiter__(self):
        for doc in await self._run():
            yield doc


# ─── Collection ──────────────────────────────────────────────────────────

class Collection:
    def __init__(self, db_path: str, name: str):
        self._db_path = db_path
        self._name = name
        self._lock = asyncio.Lock()

    async def _ensure(self, conn: aiosqlite.Connection):
        await conn.execute(f'CREATE TABLE IF NOT EXISTS "{self._name}" (doc_id TEXT PRIMARY KEY, data TEXT NOT NULL)')
        await conn.commit()

    async def _load(self) -> list:
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure(conn)
            async with conn.execute(f'SELECT data FROM "{self._name}"') as cur:
                rows = await cur.fetchall()
        return [json.loads(r[0]) for r in rows]

    def _doc_id(self, doc: dict) -> str:
        return str(doc.get("id") or doc.get("_id") or str(uuid.uuid4()))

    async def _write(self, conn: aiosqlite.Connection, doc: dict):
        await conn.execute(
            f'INSERT OR REPLACE INTO "{self._name}" (doc_id, data) VALUES (?,?)',
            (self._doc_id(doc), json.dumps(doc, default=str)),
        )

    # ── Queries ────────────────────────────────────────────────────────

    async def find_one(self, flt: Optional[dict] = None, proj: Optional[dict] = None) -> Optional[dict]:
        for doc in await self._load():
            if flt is None or _match(doc, flt):
                return _project(doc, proj)
        return None

    def find(self, flt: Optional[dict] = None, proj: Optional[dict] = None) -> Cursor:
        return Cursor(self, flt, proj)

    def aggregate(self, pipeline: list) -> AggregateCursor:
        return AggregateCursor(self, pipeline)

    async def count_documents(self, flt: Optional[dict] = None) -> int:
        docs = await self._load()
        return sum(1 for d in docs if flt is None or _match(d, flt))

    async def distinct(self, field: str, flt: Optional[dict] = None) -> list:
        docs = await self._load()
        seen: set = set()
        result = []
        for doc in docs:
            if flt and not _match(doc, flt):
                continue
            val = _get(doc, field)
            key = str(val)
            if key not in seen:
                seen.add(key)
                result.append(val)
        return result

    # ── Mutations ──────────────────────────────────────────────────────

    async def insert_one(self, doc: dict):
        async with self._lock:
            async with aiosqlite.connect(self._db_path) as conn:
                await self._ensure(conn)
                await self._write(conn, doc)
                await conn.commit()

    async def insert_many(self, docs: list):
        async with self._lock:
            async with aiosqlite.connect(self._db_path) as conn:
                await self._ensure(conn)
                for doc in docs:
                    await self._write(conn, doc)
                await conn.commit()

    async def update_one(self, flt: dict, upd: dict, upsert: bool = False) -> UpdateResult:
        async with self._lock:
            docs = await self._load()
            async with aiosqlite.connect(self._db_path) as conn:
                await self._ensure(conn)
                for doc in docs:
                    if _match(doc, flt):
                        new_doc = _apply_update(doc, upd)
                        await self._write(conn, new_doc)
                        await conn.commit()
                        return UpdateResult(1, 1)
                if upsert:
                    new_doc = {k: v for k, v in flt.items() if not k.startswith("$") and not isinstance(v, dict)}
                    new_doc = _apply_update(new_doc, upd)
                    if "id" not in new_doc:
                        new_doc["id"] = str(uuid.uuid4())
                    await self._write(conn, new_doc)
                    await conn.commit()
                    return UpdateResult(1, 1)
        return UpdateResult(0)

    async def update_many(self, flt: dict, upd: dict) -> UpdateResult:
        async with self._lock:
            docs = await self._load()
            count = 0
            async with aiosqlite.connect(self._db_path) as conn:
                await self._ensure(conn)
                for doc in docs:
                    if flt is None or _match(doc, flt):
                        await self._write(conn, _apply_update(doc, upd))
                        count += 1
                await conn.commit()
        return UpdateResult(count, count)

    async def delete_one(self, flt: dict) -> DeleteResult:
        async with self._lock:
            docs = await self._load()
            async with aiosqlite.connect(self._db_path) as conn:
                await self._ensure(conn)
                for doc in docs:
                    if _match(doc, flt):
                        await conn.execute(f'DELETE FROM "{self._name}" WHERE doc_id=?', (self._doc_id(doc),))
                        await conn.commit()
                        return DeleteResult(1)
        return DeleteResult(0)

    async def create_index(self, *args, **kwargs):
        pass  # no-op


# ─── Database ─────────────────────────────────────────────────────────────

class Database:
    def __init__(self, db_path: str):
        self._db_path = db_path
        self._cols: Dict[str, Collection] = {}

    def __getattr__(self, name: str) -> Collection:
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._cols:
            self._cols[name] = Collection(self._db_path, name)
        return self._cols[name]

    def __getitem__(self, name: str) -> Collection:
        return self.__getattr__(name)

    async def command(self, cmd: str) -> dict:
        if cmd == "dbStats":
            size = os.path.getsize(self._db_path) if os.path.exists(self._db_path) else 0
            return {"dataSize": size, "storageSize": size}
        return {}


# ─── Client (drop-in pour AsyncIOMotorClient) ─────────────────────────────

class SQLiteClient:
    def __init__(self, db_path: str):
        self._db_path = db_path
        self._dbs: Dict[str, Database] = {}

    def __getitem__(self, name: str) -> Database:
        if name not in self._dbs:
            self._dbs[name] = Database(self._db_path)
        return self._dbs[name]

    def close(self):
        pass
