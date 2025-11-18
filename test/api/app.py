import os
import time
from typing import Optional

import mysql.connector
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "db"),
    "port": int(os.environ.get("DB_PORT", "3306")),
    "user": os.environ.get("DB_USER", "appuser"),
    "password": os.environ.get("DB_PASSWORD", "apppass"),
    "database": os.environ.get("DB_NAME", "messages_db"),
}
RETRY_TIMEOUT_SECONDS = 10


class MessageRequest(BaseModel):
    content: str


class MessageResponse(BaseModel):
    content: Optional[str]
    created_at: Optional[str] = None


app = FastAPI(title="Test Message API")


def connect_with_retry() -> mysql.connector.MySQLConnection:
    """Attempt to establish a DB connection, retrying for up to RETRY_TIMEOUT_SECONDS."""
    deadline = time.time() + RETRY_TIMEOUT_SECONDS
    last_err: Optional[Exception] = None

    while time.time() < deadline:
        try:
            connection = mysql.connector.connect(**DB_CONFIG)
            connection.autocommit = False
            return connection
        except mysql.connector.Error as err:
            last_err = err
            time.sleep(1)

    raise HTTPException(status_code=503, detail=f"Database connection failed: {last_err}")


@app.post("/message", response_model=MessageResponse)
async def create_message(payload: MessageRequest):
    connection = connect_with_retry()
    cursor = connection.cursor()

    try:
        cursor.execute("INSERT INTO messages (content) VALUES (%s)", (payload.content,))
        connection.commit()
    except mysql.connector.Error as err:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to store message: {err}")
    finally:
        cursor.close()
        connection.close()

    return MessageResponse(content=payload.content)


@app.get("/message", response_model=MessageResponse)
async def read_latest_message():
    connection = connect_with_retry()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT content, created_at FROM messages ORDER BY created_at DESC, id DESC LIMIT 1"
        )
        row = cursor.fetchone()
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Failed to read message: {err}")
    finally:
        cursor.close()
        connection.close()

    if not row:
        return MessageResponse(content=None)

    created_at = row["created_at"].isoformat() if row.get("created_at") else None
    return MessageResponse(content=row.get("content"), created_at=created_at)


@app.get("/health")
async def health_check():
    """Simple health endpoint for container checks."""
    try:
        connection = connect_with_retry()
        connection.close()
    except HTTPException as exc:
        raise exc

    return {"status": "ok"}