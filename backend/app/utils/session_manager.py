from typing import Dict, List
import requests
import os

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")

class SessionManager:
    def __init__(self):
        self.histories: Dict[str, List[dict]] = {}

    def get_history(self, session_id: str) -> List[dict]:
        return self.histories.get(session_id, [])

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.histories:
            self.histories[session_id] = []

        self.histories[session_id].append({"role": role, "content": content})

        # 🔹 check if summarization needed
        self._maybe_summarize(session_id)

    def _maybe_summarize(self, session_id: str):
        history = self.histories[session_id]
        user_msgs = [m for m in history if m["role"] == "user"]

        if len(user_msgs) >= 3:
            # take first 3 user+assistant pairs (~6 messages)
            chunk = history[:6]
            text = "\n".join([f"{m['role']}: {m['content']}" for m in chunk])

            # get summary from Together API
            summary = self._summarize_with_together(text)

            # replace old messages with compact summary
            self.histories[session_id] = [
                {"role": "system", "content": f"Summary: {summary}"}
            ] + history[6:]

    def _summarize_with_together(self, text: str) -> str:
        url = "https://api.together.xyz/v1/chat/completions"
        headers = {"Authorization": f"Bearer {TOGETHER_API_KEY}"}
        data = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": "Summarize the following conversation briefly."},
                {"role": "user", "content": text}
            ],
            "max_tokens": 100,
            "temperature": 0.3
        }

        response = requests.post(url, headers=headers, json=data).json()
        return response["choices"][0]["message"]["content"].strip()
