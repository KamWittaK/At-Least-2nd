from fastapi import FastAPI
from pydantic import BaseModel
from .endpoints.TrashTalk import TrashTalk

app = FastAPI(
    title="The House API",
    version="1.0"
)

@app.get("/")
def root():
    return {"message": "Server is running!"}

@app.get("/trashtalk")
def trashtalk():
    return {"message": TrashTalk().message()}
