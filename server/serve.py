import os
import time
from collections import defaultdict

from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langserve import add_routes


load_dotenv()

groq_key = os.getenv("GROQ_API_KEY")

# Model
model = ChatGroq(
    model="openai/gpt-oss-20b",
    groq_api_key=groq_key
)

# Prompt
prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Translate the following text into {language}. "
            "Return only the translated text."
        ),
        (
            "user",
            "{text}"
        )
    ]
)

parser = StrOutputParser()

chain = prompt_template | model | parser


# FastAPI
app = FastAPI(
    title="Translation API",
    version="1.0",
    description="Small AI translation application using LangChain and LangServe"
)


# Rate Limiting
RATE_LIMIT = 3
WINDOW_SECONDS = 5 * 60

request_history = defaultdict(list)


def get_client_ip(request: Request) -> str:
    return request.client.host


def is_rate_limited(ip: str) -> bool:

    current_time = time.time()

    # Remove requests older than 5 minutes
    request_history[ip] = [
        timestamp
        for timestamp in request_history[ip]
        if current_time - timestamp < WINDOW_SECONDS
    ]

    # 3 requests already used
    if len(request_history[ip]) >= RATE_LIMIT:
        return True

    # Record request
    request_history[ip].append(current_time)

    return False


# LangServe Routes
add_routes(
    app,
    chain,
    path="/chain"
)

# Protection Middleware
@app.middleware("http")
async def protect_translation_api(
    request: Request,
    call_next
):
    
    if (
        request.url.path == "/chain/invoke"
        and request.method == "POST"
    ):

        # Rate Limit
        client_ip = get_client_ip(request)

        if is_rate_limited(client_ip):

            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too many requests.",
                    "message": (
                        "Due to API cost, your request is denied. "
                        "Please try again after 5 minutes."
                    ),
                    "limit": 3,
                    "window": "5 minutes"
                }
            )

        # Validate Request
        try:

            body = await request.json()

            input_data = body.get("input", {})

            text = input_data.get("text", "")

            if not isinstance(text, str):

                return JSONResponse(
                    status_code=400,
                    content={
                        "error": "Invalid text.",
                        "message": "Text must be a string."
                    }
                )

            # Text Length
            MAX_TEXT_LENGTH = 500

            if len(text) > MAX_TEXT_LENGTH:

                return JSONResponse(
                    status_code=413,
                    content={
                        "error": "Text too long.",
                        "message": (
                            f"Please keep the text under "
                            f"{MAX_TEXT_LENGTH} characters."
                        ),
                        "max_length": MAX_TEXT_LENGTH
                    }
                )


        except Exception:

            return JSONResponse(
                status_code=400,
                content={
                    "error": "Invalid request body."
                }
            )


    response = await call_next(request)

    return response


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Server
if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="localhost",
        port=8000
    )
