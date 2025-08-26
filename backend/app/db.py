from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables

MONGO_URI = os.getenv("MONGO_URI")  
DB_NAME = os.getenv("DB_NAME")      

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]  # This is your MongoDB database
