from datetime import datetime
from typing import List, Dict

def new_session(session_id: str):
    return {
        "session_id": session_id,
        "messages": [],
        "created_at": datetime.utcnow()
    }
