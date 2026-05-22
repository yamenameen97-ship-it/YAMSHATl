"""
Profile and Follow API endpoints
"""
import sys
from flask import Blueprint, jsonify, request
from datetime import datetime, timezone

profile_api = Blueprint("profile_api", __name__, url_prefix="/api")


def chat_runtime():
    return sys.modules.get("chat_server") or sys.modules.get("__main__")


def utc_now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def run_db(query, params=(), fetchone=False, fetchall=False, commit=False):
    runtime = chat_runtime()
    return runtime.run_db(query, params, fetchone, fetchall, commit)


def resolve_request_user():
    runtime = chat_runtime()
    return runtime.resolve_request_user()


def auth_required(fn):
    def wrapper(*args, **kwargs):
        username = resolve_request_user()
        if not username:
            return jsonify({"error": "unauthorized"}), 401
        request.current_user = username
        return fn(*args, **kwargs)
    return wrapper


# ===== Profile Endpoints =====

@profile_api.route("/profile/<username>", methods=["GET"])
def get_profile(username):
    """Get user profile information"""
    try:
        user = run_db(
            "SELECT * FROM users WHERE username = ?",
            (username,),
            fetchone=True
        )
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_dict = dict(user)
        
        # Get links if they exist
        links_row = run_db(
            "SELECT links FROM users WHERE username = ?",
            (username,),
            fetchone=True
        )
        
        return jsonify({
            "username": user_dict.get("username"),
            "email": user_dict.get("email"),
            "bio": user_dict.get("bio", ""),
            "profile_picture": user_dict.get("profile_picture", ""),
            "cover_image": user_dict.get("cover_image", ""),
            "website": user_dict.get("website", ""),
            "location": user_dict.get("location", ""),
            "followers_count": user_dict.get("followers_count", 0),
            "following_count": user_dict.get("following_count", 0),
            "posts_count": user_dict.get("posts_count", 0),
            "created_at": user_dict.get("created_at"),
            "last_seen": user_dict.get("last_seen"),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/profile/update", methods=["POST"])
@auth_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json(silent=True) or {}
        username = request.current_user
        
        # Build update query
        updates = []
        params = []
        
        if "bio" in data:
            updates.append("bio = ?")
            params.append(data["bio"])
        
        if "profile_picture" in data:
            updates.append("profile_picture = ?")
            params.append(data["profile_picture"])
        
        if "cover_image" in data:
            updates.append("cover_image = ?")
            params.append(data["cover_image"])
        
        if "website" in data:
            updates.append("website = ?")
            params.append(data["website"])
        
        if "location" in data:
            updates.append("location = ?")
            params.append(data["location"])
        
        if not updates:
            return jsonify({"error": "No fields to update"}), 400
        
        params.append(username)
        query = f"UPDATE users SET {', '.join(updates)} WHERE username = ?"
        
        run_db(query, tuple(params), commit=True)
        
        return jsonify({"status": "ok", "message": "Profile updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== Follow Endpoints =====

@profile_api.route("/follow/<target_user>", methods=["POST"])
@auth_required
def follow_user(target_user):
    """Follow a user"""
    try:
        follower = request.current_user
        
        if follower == target_user:
            return jsonify({"error": "Cannot follow yourself"}), 400
        
        # Check if target user exists
        target = run_db(
            "SELECT id FROM users WHERE username = ?",
            (target_user,),
            fetchone=True
        )
        
        if not target:
            return jsonify({"error": "User not found"}), 404
        
        # Check if already following
        existing = run_db(
            "SELECT id FROM follows WHERE follower = ? AND following = ?",
            (follower, target_user),
            fetchone=True
        )
        
        if existing:
            return jsonify({"error": "Already following this user"}), 400
        
        # Add follow relationship
        run_db(
            "INSERT INTO follows(follower, following, created_at) VALUES(?, ?, ?)",
            (follower, target_user, utc_now()),
            commit=True
        )
        
        # Update counts
        run_db(
            "UPDATE users SET following_count = following_count + 1 WHERE username = ?",
            (follower,),
            commit=True
        )
        
        run_db(
            "UPDATE users SET followers_count = followers_count + 1 WHERE username = ?",
            (target_user,),
            commit=True
        )
        
        # Send notification
        runtime = chat_runtime()
        runtime.send_notification(
            to_user=target_user,
            from_user=follower,
            notif_type="follow",
            message=f"{follower} بدأ متابعتك",
            link=f"/profile/{follower}"
        )
        
        return jsonify({"status": "ok", "message": "Following user"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/unfollow/<target_user>", methods=["POST"])
@auth_required
def unfollow_user(target_user):
    """Unfollow a user"""
    try:
        follower = request.current_user
        
        # Check if following
        existing = run_db(
            "SELECT id FROM follows WHERE follower = ? AND following = ?",
            (follower, target_user),
            fetchone=True
        )
        
        if not existing:
            return jsonify({"error": "Not following this user"}), 400
        
        # Remove follow relationship
        run_db(
            "DELETE FROM follows WHERE follower = ? AND following = ?",
            (follower, target_user),
            commit=True
        )
        
        # Update counts
        run_db(
            "UPDATE users SET following_count = MAX(0, following_count - 1) WHERE username = ?",
            (follower,),
            commit=True
        )
        
        run_db(
            "UPDATE users SET followers_count = MAX(0, followers_count - 1) WHERE username = ?",
            (target_user,),
            commit=True
        )
        
        return jsonify({"status": "ok", "message": "Unfollowed user"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/is-following/<target_user>", methods=["GET"])
@auth_required
def is_following(target_user):
    """Check if current user is following target user"""
    try:
        follower = request.current_user
        
        following = run_db(
            "SELECT id FROM follows WHERE follower = ? AND following = ?",
            (follower, target_user),
            fetchone=True
        )
        
        return jsonify({"is_following": bool(following)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/followers/<username>", methods=["GET"])
def get_followers(username):
    """Get list of followers for a user"""
    try:
        followers = run_db(
            "SELECT follower FROM follows WHERE following = ? ORDER BY created_at DESC LIMIT 100",
            (username,),
            fetchall=True
        )
        
        follower_list = [dict(f)["follower"] for f in followers]
        return jsonify(follower_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/following/<username>", methods=["GET"])
def get_following(username):
    """Get list of users that a user is following"""
    try:
        following = run_db(
            "SELECT following FROM follows WHERE follower = ? ORDER BY created_at DESC LIMIT 100",
            (username,),
            fetchall=True
        )
        
        following_list = [dict(f)["following"] for f in following]
        return jsonify(following_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/followers/count/<username>", methods=["GET"])
def get_followers_count(username):
    """Get follower count for a user"""
    try:
        result = run_db(
            "SELECT COUNT(*) as count FROM follows WHERE following = ?",
            (username,),
            fetchone=True
        )
        
        count = dict(result)["count"] if result else 0
        return jsonify({"followers_count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/following/count/<username>", methods=["GET"])
def get_following_count(username):
    """Get following count for a user"""
    try:
        result = run_db(
            "SELECT COUNT(*) as count FROM follows WHERE follower = ?",
            (username,),
            fetchone=True
        )
        
        count = dict(result)["count"] if result else 0
        return jsonify({"following_count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== Posts Endpoints =====

@profile_api.route("/posts/<username>", methods=["GET"])
def get_user_posts(username):
    """Get posts by a user"""
    try:
        posts = run_db(
            "SELECT * FROM posts WHERE author = ? ORDER BY created_at DESC LIMIT 50",
            (username,),
            fetchall=True
        )
        
        posts_list = [dict(p) for p in posts]
        return jsonify(posts_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/posts", methods=["POST"])
@auth_required
def create_post():
    """Create a new post"""
    try:
        data = request.get_json(silent=True) or {}
        author = request.current_user
        content = (data.get("content") or "").strip()
        
        if not content:
            return jsonify({"error": "Post content cannot be empty"}), 400
        
        post_id = run_db(
            "INSERT INTO posts(author, content, created_at) VALUES(?, ?, ?)",
            (author, content, utc_now()),
            commit=True
        )
        
        # Update posts count
        run_db(
            "UPDATE users SET posts_count = posts_count + 1 WHERE username = ?",
            (author,),
            commit=True
        )
        
        post = run_db(
            "SELECT * FROM posts WHERE id = ?",
            (post_id,),
            fetchone=True
        )
        
        return jsonify(dict(post)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/posts/<int:post_id>", methods=["DELETE"])
@auth_required
def delete_post(post_id):
    """Delete a post"""
    try:
        post = run_db(
            "SELECT * FROM posts WHERE id = ?",
            (post_id,),
            fetchone=True
        )
        
        if not post:
            return jsonify({"error": "Post not found"}), 404
        
        post_dict = dict(post)
        if post_dict["author"] != request.current_user:
            return jsonify({"error": "Unauthorized"}), 403
        
        run_db(
            "DELETE FROM posts WHERE id = ?",
            (post_id,),
            commit=True
        )
        
        # Update posts count
        run_db(
            "UPDATE users SET posts_count = MAX(0, posts_count - 1) WHERE username = ?",
            (post_dict["author"],),
            commit=True
        )
        
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== Like Endpoints =====

@profile_api.route("/posts/<int:post_id>/like", methods=["POST"])
@auth_required
def like_post(post_id):
    """Like a post"""
    try:
        user = request.current_user
        
        # Check if post exists
        post = run_db(
            "SELECT * FROM posts WHERE id = ?",
            (post_id,),
            fetchone=True
        )
        
        if not post:
            return jsonify({"error": "Post not found"}), 404
        
        # Check if already liked
        existing = run_db(
            "SELECT id FROM likes WHERE user = ? AND post_id = ?",
            (user, post_id),
            fetchone=True
        )
        
        if existing:
            return jsonify({"error": "Already liked this post"}), 400
        
        # Add like
        run_db(
            "INSERT INTO likes(user, post_id, created_at) VALUES(?, ?, ?)",
            (user, post_id, utc_now()),
            commit=True
        )
        
        # Update likes count
        run_db(
            "UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?",
            (post_id,),
            commit=True
        )
        
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/posts/<int:post_id>/unlike", methods=["POST"])
@auth_required
def unlike_post(post_id):
    """Unlike a post"""
    try:
        user = request.current_user
        
        # Check if liked
        existing = run_db(
            "SELECT id FROM likes WHERE user = ? AND post_id = ?",
            (user, post_id),
            fetchone=True
        )
        
        if not existing:
            return jsonify({"error": "Post not liked"}), 400
        
        # Remove like
        run_db(
            "DELETE FROM likes WHERE user = ? AND post_id = ?",
            (user, post_id),
            commit=True
        )
        
        # Update likes count
        run_db(
            "UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?",
            (post_id,),
            commit=True
        )
        
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_api.route("/posts/<int:post_id>/likes", methods=["GET"])
def get_post_likes(post_id):
    """Get likes count for a post"""
    try:
        result = run_db(
            "SELECT COUNT(*) as count FROM likes WHERE post_id = ?",
            (post_id,),
            fetchone=True
        )
        
        count = dict(result)["count"] if result else 0
        return jsonify({"likes_count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
