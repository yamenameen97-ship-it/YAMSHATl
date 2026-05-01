
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def root():
    return {"status": "AI service running"}

@app.post("/detect-spam")
def detect(data: dict):
    text = data.get("text", "")
    score = 0
    if "http" in text:
        score += 0.4
    if text.count("🔥") > 3:
        score += 0.3
    return {"spam_score": score}
