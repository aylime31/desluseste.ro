import os
from dotenv import load_dotenv

load_dotenv()

# Centralized config and environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# CORS origins
origins = [
    "https://desluseste.ro",
    "http://localhost:3000",
]
