from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import ollama
import base64
import traceback

app = FastAPI()

MODEL = "gemma4:e2b"

SYSTEM_PROMPT = """
You are an expert Bangla shop bookkeeper for a small mudi dokan in Bangladesh.

You will receive a short voice recording of a customer order spoken in natural Bangla.

Return ONLY one valid JSON object with this schema:
{
  "customer_name": string or null,
  "phone": string or null,
  "items": [
    {
      "product": string,
      "qty": number,
      "unit": string,
      "price": number or null
    }
  ],
  "payment_mode": "paid" | "partial" | "baki",
  "amount_paid": number
}

Rules:
- If they say cash/poddo dibe/taka dibe => payment_mode = "paid"
- If they say baki rakhbe or payment is not mentioned => "baki"
- If only part is paid => "partial"
- Use null if unknown.
- Output only JSON. No markdown. No explanation.
"""

@app.get("/")
def root():
    return {"status": "ok", "message": "gemma audio server running"}

@app.post("/process_audio")
async def process_audio(file: UploadFile = File(...)):
    try:
        print(f"\n--- Incoming file: {file.filename}, content_type={file.content_type}")

        audio_bytes = await file.read()
        print(f"Read {len(audio_bytes)} bytes")

        if not audio_bytes:
            return JSONResponse(
                status_code=400,
                content={"error": "Empty file received"}
            )

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        print(f"Base64 length: {len(audio_b64)}")

        response = ollama.chat(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": SYSTEM_PROMPT,
                    "audio": [audio_b64]
                }
            ]
        )

        print("Raw ollama response:")
        print(response)

        raw = response.get("message", {}).get("content", "").strip()

        if "```" in raw:
            raw = raw.replace("```json", "").replace("```", "").strip()

        print("Extracted content:")
        print(raw)

        return JSONResponse(content={
            "raw": raw,
            "debug": {
                "filename": file.filename,
                "content_type": file.content_type,
                "bytes": len(audio_bytes)
            }
        })

    except Exception as e:
        print("ERROR in /process_audio")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )