import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import ChatRequest, ChatResponse
from app.services import query_deepseek, summarize_history
from app.db import db
from app.models.chat import new_session

app = FastAPI(title="ChatGPT-Clone with DeepSeek & MongoDB")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        # Auto-generate session_id if not provided
        if not req.session_id:
            req.session_id = str(uuid.uuid4())
            session = new_session(req.session_id)
            await db.sessions.insert_one(session)

        # Find or create session
        session = await db.sessions.find_one({"session_id": req.session_id})
        if not session:
            session = new_session(req.session_id)
            await db.sessions.insert_one(session)

        # Add user message
        user_message = {"role": "user", "content": req.messages[-1].content}
        await db.sessions.update_one(
            {"session_id": req.session_id},
            {"$push": {"messages": user_message}}
        )

        # Get history
        session = await db.sessions.find_one({"session_id": req.session_id})
        history = session["messages"]

        # 🔹 Summarize every 3 user messages
        user_count = sum(1 for m in history if m["role"] == "user")
        if user_count > 0 and user_count % 3 == 0:
            summary = await summarize_history(history[:6])  # take first 3 Q&A pairs
            if summary:
                await db.sessions.update_one(
                    {"session_id": req.session_id},
                    {"$set": {"messages": [{"role": "system", "content": f"Summary: {summary}"}] + history[6:]}}
                )
                session = await db.sessions.find_one({"session_id": req.session_id})
                history = session["messages"]

        # 🔹 Query model normally (NOT summarize_history)
        reply = await query_deepseek(history)

        # Save assistant reply
        assistant_message = {"role": "assistant", "content": reply}
        await db.sessions.update_one(
            {"session_id": req.session_id},
            {"$push": {"messages": assistant_message}}
        )

        return ChatResponse(session_id=req.session_id, reply=reply)


    except Exception as e:
        import traceback
        print("Error in /chat:", traceback.format_exc())
        # Optionally, log the session_id and history for debugging
        print(f"Session ID: {req.session_id}")
        print(f"History: {history if 'history' in locals() else 'N/A'}")
        raise HTTPException(status_code=500, detail=f"Could not generate a response: {str(e)}")

