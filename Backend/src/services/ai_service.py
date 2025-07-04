import os
import uuid
import requests
import torch
from fastapi import HTTPException
from src.config import GIMINI_API_KEY, HUGGINGFACE_TOKEN
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from datetime import datetime

# Set environment for Gemini
os.environ["GOOGLE_API_KEY"] = GIMINI_API_KEY
UPLOAD_FOLDER = "upload"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Initialize Gemini for tweet and agentic check ---
try:
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.7)

    tweet_prompt = PromptTemplate(
        input_variables=["topic"],
        template="Write a short and engaging tweet about {topic} in under 380 characters. Add hashtags if relevant."
    )
    tweet_chain = tweet_prompt | llm

    image_decision_prompt = PromptTemplate(
        input_variables=["topic"],
        template="Answer with only YES or NO. Does the topic '{topic}' need a visual image to make the tweet more impactful?"
    )
    decision_chain = image_decision_prompt | llm

except Exception as e:
    print(f"Error initializing LLM: {e}")
    raise HTTPException(
        status_code=500,
        detail="Failed to initialize the language model."
    )

# --- Tweet Generator ---
def generate_tweet(topic: str) -> str:
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    if len(topic) > 100:
        raise HTTPException(status_code=400, detail="Topic must be under 100 characters")

    try:
        return tweet_chain.invoke({"topic": topic}).content.strip()
    except Exception as e:
        print(f"Error generating tweet: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate tweet")

# --- Agentic Check using Gemini ---
def should_generate_image(topic: str) -> bool:
    try:
        result = decision_chain.invoke({"topic": topic}).content.strip().upper()
        print(f"Image decision for topic '{topic}': {result}")
        return result == "YES"
    except Exception as e:
        print(f"Error checking image need: {e}")
        return False

# --- Image Generator via HF API ---
def generate_image(topic: str) -> str:
    try:
        prompt = f"Create a high-quality image based on the topic: {topic}. The image should be visually appealing and relevant to the topic. Use vibrant colors and clear details."

        headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
        payload = {"inputs": prompt}

        response = requests.post(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            image_id = uuid.uuid4()
            image_path = f"{UPLOAD_FOLDER}/image_{image_id}.png"
            with open(image_path, "wb") as f:
                f.write(response.content)
            print(f"Image saved to {image_path}")
            return image_path
        else:
            raise HTTPException(status_code=500, detail=f"HuggingFace API error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while generating the image.")

# --- Main Agentic Handler ---
def agentic_tweet_workflow(topic: str) -> dict:
    tweet = generate_tweet(topic)
    image_path = None

    if should_generate_image(topic):
        image_path = generate_image(topic)

    return {
        "topic": topic,
        "tweet": tweet,
        "image": image_path or None
    }

# --- Test Main ---
if __name__ == "__main__":
    result = agentic_tweet_workflow("The power of AI in space exploration")
    print(result)
