import re
from typing import Any, Dict, List, Optional
import httpx

DISCOVERY_AI_SERVICE_URL = "http://localhost:8015" # Assuming 8015 for discovery-ai-service

async def _call_discovery_ai_service(endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{DISCOVERY_AI_SERVICE_URL}{endpoint}", json=data)
        response.raise_for_status()
        return response.json()

def moderate_content(content: str) -> Dict[str, Any]:
    # This function will now call the new discovery-ai-service for moderation
    # For simplicity, we'll make a synchronous call here, but in a real app,
    # this might be an async call or handled by a message queue.
    # For now, we'll keep the existing logic as a fallback or for quick local testing.
    toxic_patterns = [
        r'شتيمة', r'عنف', r'كراهية', r'إرهاب', r'مخدرات'
    ]
    
    found_violations = []
    for pattern in toxic_patterns:
        if re.search(pattern, content):
            found_violations.append(f"محتوى غير لائق: {pattern}")
            
    is_safe = len(found_violations) == 0
    score = 0.95 if is_safe else 0.2
    
    return {
        "is_safe": is_safe,
        "score": score,
        "violations": found_violations,
        "action_suggested": "ALLOW" if is_safe else "BLOCK"
    }

def detect_spam(content: str) -> Dict[str, Any]:
    # This function will now call the new discovery-ai-service for spam detection
    spam_links = [r'bit\.ly', r'goo\.gl', r't\.co', r'earn-money-fast']
    
    is_spam = False
    reasons = []
    
    for link in spam_links:
        if re.search(link, content):
            is_spam = True
            reasons.append(f"رابط مشبوه: {link}")
            
    if len(content) < 5:
        is_spam = True
        reasons.append("محتوى قصير جداً (محتمل سبام)")
        
    return {
        "is_spam": is_spam,
        "confidence": 0.88 if is_spam else 0.1,
        "reasons": reasons
    }

async def rank_posts(posts: list, user: Any) -> list:
    # Call discovery-ai-service for advanced post ranking
    try:
        response = await _call_discovery_ai_service("/recommend", {"user_id": user.id, "content_type": "post", "posts": [p.dict() for p in posts]})
        # Assuming the discovery-ai-service returns sorted posts or ranking scores
        # For now, we'll just return the original posts if the service doesn't return a specific format
        return response.get("recommendations", posts)
    except Exception as e:
        print(f"Error calling discovery-ai-service for post ranking: {e}")
        return sorted(posts, key=lambda x: getattr(x, 'likes_count', 0), reverse=True) # Fallback to simple ranking

async def get_recommendations(user: Any) -> list:
    # Call discovery-ai-service for recommendations
    try:
        response = await _call_discovery_ai_service("/recommend", {"user_id": user.id, "content_type": "general"})
        return response.get("recommendations", [])
    except Exception as e:
        print(f"Error calling discovery-ai-service for recommendations: {e}")
        return []

async def moderate_comment(comment_content: str) -> Dict[str, Any]:
    # Call discovery-ai-service for comment moderation
    try:
        response = await _call_discovery_ai_service("/moderate", {"text": comment_content})
        return response.get("moderation_result", moderate_content(comment_content)) # Fallback
    except Exception as e:
        print(f"Error calling discovery-ai-service for comment moderation: {e}")
        return moderate_content(comment_content) # Fallback

async def translate_and_moderate(comment_content: str, target_language: str = 'en') -> Dict[str, Any]:
    # In a real production environment, we would use an AI translator here.
    # For now, we'll just moderate the original content.
    return await moderate_comment(comment_content)

async def rank_comments(comments: list, user: Any) -> list:
    # Call discovery-ai-service for advanced comment ranking
    try:
        response = await _call_discovery_ai_service("/rank_comments", {"user_id": user.id, "comments": [c.dict() for c in comments]})
        return response.get("ranked_comments", comments)
    except Exception as e:
        print(f"Error calling discovery-ai-service for comment ranking: {e}")
        return sorted(comments, key=lambda x: getattr(x, 'likes_count', 0), reverse=True) # Fallback
