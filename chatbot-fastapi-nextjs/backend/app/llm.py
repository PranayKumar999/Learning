from dotenv import load_dotenv
import os
from huggingface_hub import InferenceClient

load_dotenv()

# hugging_face_client = InferenceClient(model="", api_key=os.getenv("HUGGING_FACE_ACCESS_TOKEN"))
hugging_face_client = InferenceClient(model="meta-llama/Meta-Llama-3-8B-Instruct", api_key=os.getenv("HUGGING_FACE_ACCESS_TOKEN"))


# you can use async inference client incase you want to handle requests concurrently
# Dont use async because this is just for practice. 