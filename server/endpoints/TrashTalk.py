import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

parent_dir = Path(__file__).resolve().parent.parent.parent
dotenv_path = parent_dir / ".env"

load_dotenv(dotenv_path=dotenv_path)


class TrashTalk:
    def message(self):
        client = genai.Client()
        
        response = client.models.generate_content(
            model = "gemini-3.1-flash-lite-preview",
            contents = "Generate a mean trash talk message for a gambling game. Be so mean to the user that it makes them cry. Return only the message without any additional text or formatting. Make it short and impactful."
        )

        return response.text