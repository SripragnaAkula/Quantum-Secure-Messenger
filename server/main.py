"""
Quantum Secure Messenger - FINAL WORKING VERSION
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Dict, Set
import json
import uuid
from datetime import datetime

# ==================== QUANTUM ====================
from quantum.qkd_simulator import QuantumKeyDistribution

# ==================== MODELS ====================

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# ==================== DATABASE ====================

class DB:
    def __init__(self):
        self.users: Dict[str, dict] = {}
        self.friends: Dict[str, Set[str]] = {}
        self.friend_requests: Dict[str, dict] = {}
        self.messages: Dict[tuple, list] = {}
        self.connections: Dict[str, WebSocket] = {}
        self.quantum = QuantumKeyDistribution()
        self.keys: Dict[str, dict] = {}

db = DB()

# ==================== APP ====================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== AUTH ====================

@app.post("/api/register")
async def register(u: UserCreate):
    if u.username in db.users:
        raise HTTPException(400, "User exists")

    db.users[u.username] = {"username": u.username, "password": u.password}
    db.friends[u.username] = set()

    return {"username": u.username}


@app.post("/api/login")
async def login(u: UserLogin):
    if u.username not in db.users or db.users[u.username]["password"] != u.password:
        raise HTTPException(401, "Invalid")

    return {"username": u.username}


@app.get("/api/users")
async def users(query: str = ""):
    return {
        "users": [{"username": x} for x in db.users if query.lower() in x.lower()]
    }

# ==================== FRIENDS ====================

@app.post("/api/friend/request")
async def send_req(to_username: dict, from_user: str = Query(...)):
    rid = str(uuid.uuid4())

    db.friend_requests[rid] = {
        "id": rid,
        "from_user": from_user,
        "to_user": to_username["to_username"],
        "status": "pending"
    }

    await send(to_username["to_username"], {
        "type": "friend_request_received",
        "from_user": from_user,
        "request_id": rid
    })

    return {"success": True}


@app.get("/api/friend/requests")
async def get_req(username: str):
    return {
        "requests": [
            r for r in db.friend_requests.values()
            if r["to_user"] == username and r["status"] == "pending"
        ]
    }


@app.post("/api/friend/accept")
async def accept(request_id: str, username: str):
    r = db.friend_requests[request_id]
    r["status"] = "accepted"

    db.friends[r["from_user"]].add(username)
    db.friends[username].add(r["from_user"])

    return {"success": True}


@app.get("/api/friends")
async def friends(username: str):
    return {
        "friends": [
            {"username": f, "online": f in db.connections}
            for f in db.friends.get(username, [])
        ]
    }

# ==================== QUANTUM ====================

@app.post("/api/quantum/generate-key")
async def gen(user1: str, user2: str):
    res = db.quantum.generate_key()
    db.keys["_".join(sorted([user1, user2]))] = res
    return res


@app.get("/api/quantum/key-status")
async def key(user1: str, user2: str):
    return db.keys.get("_".join(sorted([user1, user2])), {
        "status": "NOT_GENERATED",
        "qber": 0
    })

# ==================== MESSAGES ====================

@app.get("/api/messages")
async def msgs(user1: str, user2: str):
    key = tuple(sorted([user1, user2]))
    return {"messages": db.messages.get(key, [])}

# ==================== WEBSOCKET ====================

@app.websocket("/ws/{username}")
async def ws(websocket: WebSocket, username: str):
    await websocket.accept()
    db.connections[username] = websocket

    # 🔥 SEND OLD MESSAGES ON CONNECT (FIX)
    await send_pending(username)

    try:
        while True:
            data = json.loads(await websocket.receive_text())

            if data["type"] == "chat_message":
                await handle_msg(username, data)

            elif data["type"] == "quantum_key_request":
                await handle_key(username, data)

            elif data["type"] == "ping":
                await send(username, {"type": "pong"})

    except WebSocketDisconnect:
        db.connections.pop(username, None)

# ==================== HANDLERS ====================

async def handle_msg(sender, data):
    to = data["to_user"]
    content = data["content"]

    key = tuple(sorted([sender, to]))
    pair = "_".join(sorted([sender, to]))

    if pair not in db.keys:
        db.keys[pair] = db.quantum.generate_key()

    msg = {
        "id": str(uuid.uuid4()),
        "from": sender,
        "to": to,
        "content": content,
        "timestamp": datetime.now().isoformat()
    }

    db.messages.setdefault(key, []).append(msg)

    # 🔥 SEND TO RECEIVER
    await send(to, {"type": "new_message", "message": msg})

    # 🔥 ALSO SEND BACK TO SENDER (VERY IMPORTANT FIX)
    await send(sender, {"type": "new_message", "message": msg})


async def handle_key(sender, data):
    to = data["to_user"]
    res = db.quantum.generate_key()

    db.keys["_".join(sorted([sender, to]))] = res

    await send(sender, {"type": "quantum_key_ready", **res})
    await send(to, {"type": "quantum_key_ready", **res})


async def send_pending(username):
    for msgs in db.messages.values():
        for m in msgs:
            if m["to"] == username:
                await send(username, {"type": "new_message", "message": m})


async def send(user, data):
    ws = db.connections.get(user)
    if ws:
        await ws.send_json(data)

# ==================== FRONTEND ====================

from fastapi.responses import HTMLResponse
import os

@app.get("/", response_class=HTMLResponse)
async def index():
    file_path = os.path.join(os.path.dirname(__file__), "../client/index.html")
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

# ==================== RUN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)