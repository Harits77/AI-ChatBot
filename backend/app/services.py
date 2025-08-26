import httpx
import os
from dotenv import load_dotenv

load_dotenv()
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "deepseek-ai/DeepSeek-R1")

# 🔹 Normal chatbot query
async def query_deepseek(history):
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.together.xyz/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {TOGETHER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL_NAME,
                    "messages": history
                }
            )
        data = response.json()
        choice = data.get("choices", [{}])[0].get("message", {})
        reply = choice.get("content", "").strip()
        return reply if reply else "⚠️ No reply generated."
    except Exception as e:
        print("❌ query_deepseek error:", str(e))
        return "⚠️ Error fetching response."

# 🔹 Summarization
async def summarize_history(history):
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.together.xyz/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {TOGETHER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL_NAME,
                    "messages": [
                        {"role": "system", "content": "Summarize the following conversation briefly."},
                        {"role": "user", "content": "\n".join([f"{m['role']}: {m['content']}" for m in history])}
                    ],
                    "max_tokens": 100,
                    "temperature": 0.3
                }
            )
        data = response.json()
        choice = data.get("choices", [{}])[0].get("message", {})
        return choice.get("content", "").strip()
    except Exception as e:
        print("❌ summarize_history error:", str(e))
        return None
