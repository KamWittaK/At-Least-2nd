from pydoc import text

from fastapi import FastAPI
from pydantic import BaseModel
from .endpoints.TrashTalk import TrashTalk
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from io import BytesIO

app = FastAPI(
    title="The House API",
    version="1.0"
)

origins = [
    "http://localhost:5173",  # Vue dev server
    "http://127.0.0.1:5173",  # optional alternative
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] to allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Server is running!"}

@app.get("/trashtalk")
def trashtalk():
    return {"message": TrashTalk().message()}


@app.get("/tts")
def text_to_speech(text: str):
    tts_bytes = TrashTalk().generate_and_play_speech(text)
    
    # Use BytesIO to create a file-like object for StreamingResponse
    return StreamingResponse(BytesIO(tts_bytes), media_type="audio/mpeg")