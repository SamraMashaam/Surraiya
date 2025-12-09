from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta, UTC
from transformers import pipeline
import motor.motor_asyncio
from bson import ObjectId
import os
from collections import Counter

app = FastAPI(title="Mood Journal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.mood_journal
entries_collection = db.entries

print("Loading emotion classifier (once per strtaup)")
classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None
)
print("Model loaded successfully")

class JournalEntry(BaseModel):
    user_id: str = Field(..., description="User identifier")
    content: str = Field(..., min_length=5, description="Journal entry text")
    date: Optional[datetime] = None

class JournalEntryResponse(BaseModel):
    id: str
    user_id: str
    content: str
    date: datetime
    emotion: str
    confidence: float
    all_scores: dict

class MonthlyStats(BaseModel):
    month: str
    total_entries: int
    dominant_emotion: str
    emotion_breakdown: dict
    average_confidence: float
    entries: List[JournalEntryResponse]

def analyze_emotion(text: str) -> dict:     #anger disgust fear joy neutral sadness surprise
    results = classifier(text)[0]
    results_sorted = sorted(results, key=lambda x: x['score'], reverse=True)
    top_emotion = results_sorted[0]
    
    return {
        'emotion': top_emotion['label'],
        'confidence': top_emotion['score'],
        'all_scores': {r['label']: round(r['score'], 3) for r in results_sorted}
    }

def entry_helper(entry) -> dict:
    return {
        "id": str(entry["_id"]),
        "user_id": entry["user_id"],
        "content": entry["content"],
        "date": entry["date"],
        "emotion": entry["emotion"],
        "confidence": entry["confidence"],
        "all_scores": entry["all_scores"]
    }


@app.get("/")
async def root():
    return {"message": "Mood Journal API", "status": "running"}

@app.post("/api/entries", response_model=JournalEntryResponse)
async def create_entry(entry: JournalEntry):
    
    sentiment = analyze_emotion(entry.content)
    
    entry_dict = {
        "user_id": entry.user_id,
        "content": entry.content,
        "date": entry.date or datetime.utcnow(),
        "emotion": sentiment['emotion'],
        "confidence": sentiment['confidence'],
        "all_scores": sentiment['all_scores'],
        "created_at": datetime.now(UTC)
    }
    
    result = await entries_collection.insert_one(entry_dict)
    entry_dict["_id"] = result.inserted_id
    
    return entry_helper(entry_dict)

@app.get("/api/entries/{user_id}", response_model=List[JournalEntryResponse])
async def get_user_entries(user_id: str, limit: int = 50):
    entries = []
    async for entry in entries_collection.find(
        {"user_id": user_id}
    ).sort("date", -1).limit(limit):
        entries.append(entry_helper(entry))
    
    return entries

@app.get("/api/entries/{user_id}/monthly", response_model=MonthlyStats)
async def get_monthly_stats(user_id: str, year: int, month: int):
    
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    entries = []
    async for entry in entries_collection.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lt": end_date}
    }).sort("date", -1):
        entries.append(entry_helper(entry))
    
    if not entries:
        raise HTTPException(status_code=404, detail="No entries found for this month")
    
    emotions = [e['emotion'] for e in entries]
    emotion_counts = Counter(emotions)
    dominant_emotion = emotion_counts.most_common(1)[0][0]
    
    avg_confidence = sum(e['confidence'] for e in entries) / len(entries)
    
    emotion_breakdown = {
        emotion: {
            "count": count,
            "percentage": round(count / len(entries) * 100, 1)
        }
        for emotion, count in emotion_counts.items()
    }
    
    return MonthlyStats(
        month=f"{year}-{month:02d}",
        total_entries=len(entries),
        dominant_emotion=dominant_emotion,
        emotion_breakdown=emotion_breakdown,
        average_confidence=round(avg_confidence, 3),
        entries=entries
    )

@app.get("/api/entries/{user_id}/today", response_model=Optional[JournalEntryResponse])
async def get_today_entry(user_id: str):
    today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    entry = await entries_collection.find_one({
        "user_id": user_id,
        "date": {"$gte": today_start, "$lt": today_end}
    })
    
    if entry:
        return entry_helper(entry)
    return None

@app.delete("/api/entries/{entry_id}")
async def delete_entry(entry_id: str):
    try:
        result = await entries_collection.delete_one({"_id": ObjectId(entry_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"message": "Entry deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)