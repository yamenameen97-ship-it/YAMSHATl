"""
Patch file to expose engagement models.
Append the following to backend/app/models/__init__.py:

from .engagement import (
    DailyTask, UserDailyTask,
    UserLevel, HostLevel,
    Achievement, UserAchievement,
    LuckyWheelPrize, LuckyWheelSpin,
    ReferralCode, Referral,
    ShopItem, UserInventory,
    VoiceRoom, VoiceRoomMember, VoiceRoomMessage,
)
"""
