
import hashlib, html, jwt, os

SECRET = os.getenv("SECRET_KEY","secret")

def hash_pw(p):
    return hashlib.sha256(p.encode()).hexdigest()

def clean(t):
    return html.escape(t)

def create_token(user):
    return jwt.encode({"user":user}, SECRET, algorithm="HS256")

def verify_token(token):
    try:
        return jwt.decode(token, SECRET, algorithms=["HS256"])
    except:
        return None
