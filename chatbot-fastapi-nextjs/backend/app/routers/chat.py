from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.schemas import Chat
from app.llm import hugging_face_client
from app.users import current_active_user
from app.db import User
import json
import time

router = APIRouter()

@router.post("/chat")
async def chat(body: Chat, user: User = Depends(current_active_user)):
    try:
        messages = [{"role": m.role, "content": m.content} for m in body.messages]

        def generate():
            llm_stream = hugging_face_client.chat_completion(
                messages=messages,
                stream=True,
                max_tokens=20
            )

            for chunk in llm_stream:
                # Convert the chunk to a dictionary format
                chunk_dict = {
                    "id": getattr(chunk, 'id', None),
                    "object": "chat.completion.chunk",
                    "choices": [{
                        "index": 0,
                        "delta": {"content": chunk.choices[0].delta.content if chunk.choices and chunk.choices[0].delta else ""},
                        "finish_reason": chunk.choices[0].finish_reason if chunk.choices else None
                    }]
                }
                yield json.dumps(chunk_dict) + "\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------
# ✅ SECOND ROUTE: STREAMS HARDCODED CHUNKS (NO MODEL)
# ------------------------------------------------------

@router.get("/chat/fake-stream")
async def fake_stream(user: User = Depends(current_active_user)):
    """
    This returns hard-coded simulated streaming chunks to test frontend.
    No LLM is called.
    """

    def generate():
        chunks = [
            {
                "id": "fake-1",
                "object": "chat.completion.chunk",
                "choices": [
                    {
                        "index": 0,
                        "delta": {"content": "Hello"},
                        "finish_reason": None
                    }
                ]
            },
            {
                "id": "fake-2",
                "object": "chat.completion.chunk",
                "choices": [
                    {
                        "index": 0,
                        "delta": {"content": " world"},
                        "finish_reason": None
                    }
                ]
            },
            {
                "id": "fake-3",
                "object": "chat.completion.chunk",
                "choices": [
                    {
                        "index": 0,
                        "delta": {},
                        "finish_reason": "stop"
                    }
                ]
            }
        ]

        # Simulate real chunked streaming
        for c in chunks:
            yield json.dumps(c) + "\n"
            time.sleep(0.1)  # optional delay

    return StreamingResponse(generate(), media_type="text/event-stream")