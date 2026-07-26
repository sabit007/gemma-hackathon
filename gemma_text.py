from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import ollama

app = FastAPI()

MODEL = "gemma:2b"

class TextInput(BaseModel):
    text: str

SYSTEM_PROMPT = """You are an expert Bangla shop bookkeeper for a small "mudi dokan" in Bangladesh.

You will receive a customer order spoken in natural Bangla (already transcribed).

Your ONLY job is to output ONE valid JSON object and NOTHING else.

JSON Schema (must follow exactly):
{
  "customer_name": string or null,
  "phone": string or null,
  "items": [
    {
      "product": string,
      "qty": number,
      "unit": string (kg, pcs, litre, etc.),
      "price": number (unit price, can be null if unknown)
    }
  ],
  "payment_mode": "paid" | "partial" | "baki",
  "amount_paid": number
}

Rules:
- If they say "poddo dibe", "cash dibe", or "taka dibe" → payment_mode = "paid"
- If they say "baki rakhbe" or nothing about payment → payment_mode = "baki"
- If partial payment → payment_mode = "partial"
- Use the product names exactly as spoken.
- If customer name or phone is missing, set to null.
- Output ONLY the JSON. No extra text, no explanation, no markdown.
"""

@app.post("/process_text")
async def process_text(input: TextInput):
    response = ollama.chat(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": input.text}
        ]
    )
    raw = response["message"]["content"].strip()

    # Clean possible markdown fences
    if "```" in raw:
        raw = raw.split("```")[1].replace("json", "").strip()

    return JSONResponse(content={"raw": raw})