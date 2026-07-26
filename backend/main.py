from fastapi import FastAPI, UploadFile, File, Header, HTTPException
import requests
import base64
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Gemma 4 Bangla Bookkeeping API",
    version="1.0.0"
)

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "gemma4:e2b"

API_KEY = os.getenv("API_KEY")


SALE_SCHEMA = {
    "type": "object",
    "properties": {
        "customer_name": {
            "type": "string"
        },
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "number"},
                    "unit": {"type": "string"},
                    "unit_price": {"type": "number"},
                    "total": {"type": "number"}
                },
                "required": [
                    "name",
                    "quantity",
                    "unit",
                    "unit_price",
                    "total"
                ]
            }
        },
        "total_amount": {
            "type": "number"
        },
        "paid_amount": {
            "type": "number"
        },
        "baki_amount": {
            "type": "number"
        },
        "transaction_type": {
            "type": "string",
            "enum": [
                "cash_sale",
                "credit_sale",
                "payment",
                "unknown"
            ]
        },
        "transcription": {
            "type": "string"
        }
    },
    "required": [
        "customer_name",
        "items",
        "total_amount",
        "paid_amount",
        "baki_amount",
        "transaction_type",
        "transcription"
    ]
}


PROMPT = """
You are a Bangla bookkeeping assistant for a small shop in Bangladesh.

Listen to the provided audio and extract the shop transaction.

The speaker may use:
- Bangla
- Banglish
- English words mixed with Bangla
- Bangla numbers
- Bangladeshi currency expressions
- common shop terminology such as "baki"

Extract the transaction into the provided JSON schema.

Rules:

1. Transcribe the speaker's words into Bangla in the transcription field.
2. Identify the customer if a customer name is mentioned.
3. Extract every item sold.
4. Extract quantity, unit and price when mentioned.
5. Calculate item totals when possible.
6. Calculate total_amount when possible.
7. paid_amount is the amount actually paid during this transaction.
8. baki_amount is the unpaid amount from this transaction.
9. If the customer owes money from this sale, transaction_type is "credit_sale".
10. If everything was paid, transaction_type is "cash_sale".
11. If the audio describes payment toward an existing debt rather than a new purchase, use "payment".
12. Do not invent information.
13. If something cannot be determined, use an empty string or 0.
14. Return ONLY the JSON object.
"""


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Gemma 4 Bangla Bookkeeping API"
    }


@app.get("/health")
def health():
    try:
        response = requests.get(
            "http://localhost:11434/api/tags",
            timeout=5
        )

        if response.status_code == 200:
            return {
                "status": "healthy",
                "ollama": "connected",
                "model": MODEL
            }

        return {
            "status": "unhealthy",
            "ollama": "unavailable"
        }

    except requests.RequestException:
        return {
            "status": "unhealthy",
            "ollama": "unavailable"
        }


@app.post("/process-sale")
async def process_sale(
    file: UploadFile = File(...),
    x_api_key: str = Header(None)
):

    # Simple authentication
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    # Read audio
    audio_data = await file.read()

    if not audio_data:
        raise HTTPException(
            status_code=400,
            detail="Audio file is empty"
        )

    # Convert audio to base64
    audio_base64 = base64.b64encode(audio_data).decode("utf-8")

    try:

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": PROMPT,
                        "images": [audio_base64]
                    }
                ],
                "format": SALE_SCHEMA,
                "stream": False,
                "options": {
                    "temperature": 0
                }
            },
            timeout=120
        )

        response.raise_for_status()

    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemma/Ollama error: {str(e)}"
        )

    result = response.json()

    try:
        content = result["message"]["content"]

        structured_data = json.loads(content)

        return structured_data

    except (KeyError, json.JSONDecodeError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not parse Gemma response: {str(e)}"
        )