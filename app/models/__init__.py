from app.models.app_setting import AppSetting  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.close_friend import CloseFriend  # noqa: F401
from app.models.hidden_story_user import HiddenStoryUser  # noqa: F401
from app.models.comment import Comment  # noqa: F401
from app.models.comment_like import CommentLike  # noqa: F401
from app.models.follow import Follow  # noqa: F401
from app.models.friendship import Friendship  # noqa: F401
from app.models.like import Like  # noqa: F401
from app.models.login_challenge import LoginChallenge  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.message_reaction import MessageReaction  # noqa: F401
from app.models.message_attachment import MessageAttachment  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.post import Post  # noqa: F401
from app.models.post_edit_history import PostEditHistory  # noqa: F401
from app.models.post_poll_vote import PostPollVote  # noqa: F401
from app.models.post_save import PostSave  # noqa: F401
from app.models.post_share import PostShare  # noqa: F401
from app.models.post_preference import PostPreference, CommentReaction  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_block import UserBlock  # noqa: F401
from app.models.user_mute import UserMute  # noqa: F401
from app.models.muted_story_user import MutedStoryUser  # noqa: F401
from app.models.user_preference import UserPreference  # noqa: F401
from app.models.user_profile import UserProfile  # noqa: F401
from app.models.user_session import UserSession  # noqa: F401
from app.models.user_wallet import UserWallet  # noqa: F401
from app.models.platform_metrics import PlatformMetricsDaily, PostView, RevenueTransaction  # noqa: F401
from app.models.report import Report, ReportEvent  # noqa: F401
from app.models.search_history import SearchCategoryEnum, SearchHistory  # noqa: F401
from app.models.stories_reels import Reel, ReelComment, ReelLike, ReelView, SavedReel, Story, StoryReply, StoryView  # noqa: F401
from app.models.group import Group, GroupMember, GroupInvitation, GroupJoinRequest, GroupPost, GroupRule, GroupEvent, GroupPoll, GroupAnnouncement, GroupSettings  # noqa: F401

# --- Engagement & Gamification (added) ---
from app.models.engagement import (  # noqa: F401
    DailyTask, UserDailyTask,
    UserLevel,
    Achievement, UserAchievement,
    LuckyWheelPrize, LuckyWheelSpin,
    ReferralCode, Referral,
    ShopItem, UserInventory,
    VoiceRoom, VoiceRoomMember, VoiceRoomMessage,
)
