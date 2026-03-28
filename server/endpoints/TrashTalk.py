import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from elevenlabs.client import ElevenLabs
from elevenlabs import ElevenLabs, voices


parent_dir = Path(__file__).resolve().parent.parent.parent
dotenv_path = parent_dir / ".env"

load_dotenv(dotenv_path=dotenv_path)

ElevenLabsClient = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

class TrashTalk:
    def message(self):
        client = genai.Client()
        
        response = client.models.generate_content(
            model = "gemini-3.1-flash-lite-preview",
            contents = """Generate a short, sharp trash talk message for a gambling game. The tone should be ruthless, sarcastic, and humiliating, but remain within platform safety guidelines.

Use witty insults about poor skill, bad luck, and embarrassing gameplay. Avoid threats, slurs, or references to family, protected groups, or real-world harm.

Make the message feel intense and cutting, like a competitive opponent mocking a terrible performance.

Keep it concise (1–2 sentences max) and impactful.

Return only the message with no extra text or formatting.""")

        return response.text

    def generate_and_play_speech(self, text: str):
        # call the text-to-speech convert method
        audio_gen = ElevenLabsClient.text_to_speech.convert(
            text=text,
            voice_id="EXAVITQu4vr4xnSDxMaL",  # replace with your voice ID
            model_id="eleven_multilingual_v2",  # recommended TTS model
            output_format="mp3_44100_128"
        )

        audio_bytes = b"".join(audio_gen)


        return audio_bytes