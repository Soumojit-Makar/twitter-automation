import os
from src.config import GIMINI_API_KEY
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
os.environ["GOOGLE_API_KEY"] = GIMINI_API_KEY
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.7)
prompt = PromptTemplate(
    input_variables=["topic"],
    template="Write a short and engaging tweet about {topic} in under 380 characters. Add hashtags if relevant."
)
tweet_chain = prompt | llm
def generate_tweet(topic: str) -> str:
    return tweet_chain.invoke({"topic": topic}).content 
if __name__ == "__main__":
    print(generate_tweet("Python more provasonal"))
