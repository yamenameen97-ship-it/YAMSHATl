"""
بيانات أولية: مهام يومية + شارات + جوائز عجلة الحظ + عناصر متجر افتراضية
يُستدعى عند أول تشغيل أو من سكربت إداري.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.engagement import (
    DailyTask, Achievement, LuckyWheelPrize, ShopItem,
)


DEFAULT_DAILY_TASKS = [
    dict(code="daily_login", title="تسجيل الدخول اليومي",
         description="افتح التطبيق مرة واحدة على الأقل",
         icon="✅", reward_coins=50, reward_xp=10,
         target_count=1, category="daily", sort_order=1),
    dict(code="post_create", title="انشر منشوراً",
         description="انشر منشوراً واحداً اليوم",
         icon="📝", reward_coins=80, reward_xp=20,
         target_count=1, category="social", sort_order=2),
    dict(code="like_posts", title="أعجب بـ 10 منشورات",
         description="ادعم أصدقاءك بالإعجابات",
         icon="❤️", reward_coins=40, reward_xp=10,
         target_count=10, category="social", sort_order=3),
    dict(code="send_messages", title="أرسل 5 رسائل",
         description="تواصل مع أصدقائك",
         icon="💬", reward_coins=30, reward_xp=10,
         target_count=5, category="social", sort_order=4),
    dict(code="watch_live", title="شاهد بثاً لمدة 10 دقائق",
         description="ادعم المضيفين بمشاهدة بث مباشر",
         icon="📺", reward_coins=60, reward_xp=15,
         target_count=10, category="viewer", sort_order=5),
    dict(code="send_gift", title="أرسل هدية واحدة",
         description="أرسل هدية في أي بث",
         icon="🎁", reward_coins=100, reward_xp=30,
         target_count=1, category="viewer", sort_order=6),
    dict(code="host_live_30m", title="ابث لمدة 30 دقيقة",
         description="افتح بثاً مباشراً لمدة 30 دقيقة",
         icon="🎙️", reward_coins=200, reward_xp=80,
         target_count=30, category="host", sort_order=7),
    dict(code="join_voice_room", title="انضم لغرفة صوتية",
         description="انضم لغرفة صوتية لمدة 15 دقيقة",
         icon="🔊", reward_coins=70, reward_xp=20,
         target_count=15, category="social", sort_order=8),
    dict(code="invite_friend", title="ادعُ صديقاً جديداً",
         description="استخدم كود الإحالة لدعوة صديق",
         icon="👥", reward_coins=500, reward_xp=100,
         target_count=1, category="social", sort_order=9),
]


DEFAULT_ACHIEVEMENTS = [
    dict(code="first_post", title="أول منشور",
         description="انشر أول منشور لك على يمشات",
         icon="🌟", rarity="common", reward_coins=100, reward_xp=50),
    dict(code="100_followers", title="100 متابع",
         description="اجمع 100 متابع",
         icon="👥", rarity="rare", reward_coins=500, reward_xp=200),
    dict(code="1k_followers", title="ألف متابع",
         description="اجمع 1000 متابع",
         icon="🏆", rarity="epic", reward_coins=2000, reward_xp=1000),
    dict(code="first_live", title="أول بث مباشر",
         description="ابدأ أول بث مباشر لك",
         icon="📡", rarity="common", reward_coins=200, reward_xp=100),
    dict(code="big_spender", title="داعم سخي",
         description="أرسل هدايا بقيمة 10000 ألماسة",
         icon="💎", rarity="epic", reward_coins=1500, reward_xp=500),
    dict(code="top_host", title="مضيف نخبة",
         description="ادخل قائمة أفضل 10 مضيفين أسبوعياً",
         icon="👑", rarity="legendary", reward_coins=5000, reward_xp=2000),
    dict(code="social_butterfly", title="فراشة اجتماعية",
         description="أرسل 100 رسالة في يوم واحد",
         icon="🦋", rarity="rare", reward_coins=300, reward_xp=150),
    dict(code="wheel_winner", title="فائز عجلة الحظ",
         description="افز بجائزة كبرى من عجلة الحظ",
         icon="🎡", rarity="rare", reward_coins=400, reward_xp=150),
    dict(code="referrer_5", title="داعية يمشات",
         description="ادعُ 5 أصدقاء وأكمل تسجيلهم",
         icon="🎯", rarity="epic", reward_coins=2500, reward_xp=1000),
]


DEFAULT_WHEEL_PRIZES = [
    dict(label="50 عملة", prize_type="coins", prize_value=50,
         color="#10B981", icon="🪙", probability_weight=30.0),
    dict(label="200 عملة", prize_type="coins", prize_value=200,
         color="#3B82F6", icon="💰", probability_weight=20.0),
    dict(label="1000 عملة", prize_type="coins", prize_value=1000,
         color="#F59E0B", icon="🏆", probability_weight=5.0),
    dict(label="50 XP", prize_type="xp", prize_value=50,
         color="#8B5CF6", icon="⭐", probability_weight=15.0),
    dict(label="200 XP", prize_type="xp", prize_value=200,
         color="#EC4899", icon="✨", probability_weight=8.0),
    dict(label="إطار نادر", prize_type="frame", prize_value=0,
         color="#F43F5E", icon="🖼️", probability_weight=4.0),
    dict(label="خلفية مميزة", prize_type="background", prize_value=0,
         color="#06B6D4", icon="🌌", probability_weight=3.0),
    dict(label="حاول مرة أخرى", prize_type="coins", prize_value=10,
         color="#6B7280", icon="🔄", probability_weight=15.0),
]


DEFAULT_SHOP_ITEMS = [
    # إطارات
    dict(code="frame_gold", name="إطار ذهبي", item_type="frame",
         category="frames", image_url="/assets/shop/frame_gold.png",
         style="static", price_coins=2000, rarity="epic",
         required_level=10, sort_order=1),
    dict(code="frame_neon", name="إطار نيون متحرك", item_type="frame",
         category="frames", image_url="/assets/shop/frame_neon.gif",
         style="animated", price_coins=3500, rarity="epic",
         required_level=15, sort_order=2),
    dict(code="frame_diamond", name="إطار ألماسي", item_type="frame",
         category="frames", image_url="/assets/shop/frame_diamond.png",
         style="animated", price_diamonds=500, rarity="legendary",
         required_level=25, sort_order=3),
    dict(code="frame_silver", name="إطار فضي", item_type="frame",
         category="frames", image_url="/assets/shop/frame_silver.png",
         style="static", price_coins=800, rarity="rare",
         required_level=5, sort_order=4),

    # صور شخصية مميزة (avatar set)
    dict(code="avatar_lion", name="صورة الأسد الملكي", item_type="avatar",
         category="avatars", image_url="/assets/shop/avatar_lion.png",
         style="static", price_coins=1500, rarity="rare",
         required_level=8, sort_order=10),
    dict(code="avatar_dragon", name="صورة التنين الذهبي", item_type="avatar",
         category="avatars", image_url="/assets/shop/avatar_dragon.gif",
         style="animated", price_coins=4000, rarity="epic",
         required_level=20, sort_order=11),
    dict(code="avatar_phoenix", name="صورة العنقاء", item_type="avatar",
         category="avatars", image_url="/assets/shop/avatar_phoenix.gif",
         style="animated", price_diamonds=700, rarity="legendary",
         required_level=30, sort_order=12),

    # خلفيات حساب مميزة
    dict(code="bg_galaxy", name="خلفية المجرة", item_type="background",
         category="backgrounds", image_url="/assets/shop/bg_galaxy.jpg",
         style="image", price_coins=1200, rarity="rare",
         required_level=5, sort_order=20),
    dict(code="bg_ocean_wave", name="خلفية موجة المحيط", item_type="background",
         category="backgrounds", image_url="/assets/shop/bg_ocean.mp4",
         style="video", price_coins=2500, rarity="epic",
         required_level=12, sort_order=21),
    dict(code="bg_aurora", name="خلفية الشفق القطبي", item_type="background",
         category="backgrounds", image_url="/assets/shop/bg_aurora.mp4",
         style="video", price_coins=3500, rarity="epic",
         required_level=18, sort_order=22),
    dict(code="bg_royal", name="خلفية القصر الملكي", item_type="background",
         category="backgrounds", image_url="/assets/shop/bg_royal.jpg",
         style="image", price_diamonds=400, rarity="legendary",
         required_level=30, sort_order=23),

    # تأثيرات دخول
    dict(code="entrance_fire", name="دخول النار", item_type="entrance",
         category="effects", image_url="/assets/shop/entrance_fire.svga",
         style="animated", price_coins=5000, rarity="epic",
         required_level=15, duration_days=30, sort_order=30),
    dict(code="entrance_royal", name="دخول ملكي", item_type="entrance",
         category="effects", image_url="/assets/shop/entrance_royal.svga",
         style="animated", price_diamonds=800, rarity="legendary",
         required_level=25, duration_days=30, sort_order=31),
]


def seed_engagement(db: Session) -> dict:
    """يُنشئ البيانات الأولية إن لم تكن موجودة."""
    counts = {"tasks": 0, "achievements": 0, "wheel": 0, "shop": 0}

    for t in DEFAULT_DAILY_TASKS:
        exists = db.execute(select(DailyTask).where(DailyTask.code == t["code"])).first()
        if not exists:
            db.add(DailyTask(**t))
            counts["tasks"] += 1

    for a in DEFAULT_ACHIEVEMENTS:
        exists = db.execute(select(Achievement).where(Achievement.code == a["code"])).first()
        if not exists:
            db.add(Achievement(**a))
            counts["achievements"] += 1

    for w in DEFAULT_WHEEL_PRIZES:
        exists = db.execute(select(LuckyWheelPrize).where(
            LuckyWheelPrize.label == w["label"])).first()
        if not exists:
            db.add(LuckyWheelPrize(**w))
            counts["wheel"] += 1

    for s in DEFAULT_SHOP_ITEMS:
        exists = db.execute(select(ShopItem).where(ShopItem.code == s["code"])).first()
        if not exists:
            db.add(ShopItem(**s))
            counts["shop"] += 1

    db.commit()
    return counts
