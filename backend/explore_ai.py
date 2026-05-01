
from flask import Blueprint, jsonify, request

explore_bp = Blueprint("explore_bp", __name__)

streams = [
    {"id": "1", "title": "Gaming 🔥", "viewers": 120, "likes": 50},
    {"id": "2", "title": "Chatting 🎤", "viewers": 80, "likes": 20},
    {"id": "3", "title": "Music 🎶", "viewers": 200, "likes": 90},
]

def rank_streams(items):
    for item in items:
        item["score"] = item["viewers"] * 0.7 + item["likes"] * 0.3
    return sorted(items, key=lambda x: x["score"], reverse=True)

@explore_bp.get("/explore")
def explore():
    return jsonify(rank_streams(streams))

@explore_bp.get("/foryou")
def foryou():
    interest = request.args.get("interest", "Gaming")
    filtered = [s for s in streams if interest.lower() in s["title"].lower()]
    return jsonify(rank_streams(filtered if filtered else streams))
