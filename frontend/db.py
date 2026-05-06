import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

DB_FILE = "db.json"

class JSONCollection:
    def __init__(self, name, db):
        self.name = name
        self.db = db

    async def find_one(self, query):
        data = self.db._data_cache
        collection_data = data.get(self.name, [])
        for item in collection_data:
            if all(item.get(k) == v for k, v in query.items()):
                return item
        return None

    async def insert_one(self, document):
        data = self.db._data_cache
        if self.name not in data:
            data[self.name] = []
        
        # Add a mock _id if not present
        if "_id" not in document:
            document["_id"] = str(len(data[self.name]) + 1)
        
        data[self.name].append(document)
        self.db._save(data)
        
        class InsertResult:
            def __init__(self, id): self.inserted_id = id
        return InsertResult(document["_id"])

    def find(self, query=None):
        data = self.db._data_cache
        collection_data = data.get(self.name, [])
        if query:
            collection_data = [item for item in collection_data if all(item.get(k) == v for k, v in query.items())]
        
        class Cursor:
            def __init__(self, items): self.items = items
            def sort(self, *args, **kwargs): return self
            async def to_list(self, length): return self.items[:length]
        return Cursor(collection_data)

    async def delete_one(self, query):
        data = self.db._data_cache
        collection_data = data.get(self.name, [])
        for i, item in enumerate(collection_data):
            if all(item.get(k) == v for k, v in query.items()):
                collection_data.pop(i)
                data[self.name] = collection_data
                self.db._save(data)
                return True
        return False

class JSONDatabase:
    def __init__(self, filename=DB_FILE):
        self.filename = filename
        if not os.path.exists(self.filename):
            with open(self.filename, 'w') as f:
                json.dump({}, f)
        # load data into memory once to reduce file I/O on every read
        self._data_cache = self._load()

    def _load(self):
        try:
            with open(self.filename, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _save(self, data):
        with open(self.filename, 'w') as f:
            json.dump(data, f, indent=4)
        # update in-memory cache
        self._data_cache = data

    def __getitem__(self, name):
        return JSONCollection(name, self)

db_instance = JSONDatabase()

async def get_database():
    return db_instance
