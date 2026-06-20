import React, { useState, useEffect } from "react";
import "./AdvancedGiftPicker.css";

export default function AdvancedGiftPicker({ 
  gifts = [], 
  userBalance = 0,
  onSend,
  streamId,
  userId,
  userName,
  userAvatar
}) {
  const [selectedGift, setSelectedGift] = useState(null);
  const [amount, setAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filteredGifts, setFilteredGifts] = useState(gifts);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (activeCategory === "all") {
      setFilteredGifts(gifts);
    } else {
      setFilteredGifts(gifts.filter(g => g.category === activeCategory));
    }
  }, [activeCategory, gifts]);

  const handleSendGift = async () => {
    if (!selectedGift) {
      setError("يرجى اختيار هدية");
      return;
    }

    const totalCost = selectedGift.coins * amount;
    if (userBalance < totalCost) {
      setError(`رصيد غير كافي. تحتاج إلى ${totalCost - userBalance} عملة إضافية`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gifts/${streamId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_id: userId,
          sender_name: userName,
          sender_avatar: userAvatar,
          receiver_id: streamId, // معرف المضيف
          gift_id: selectedGift.id,
          amount: amount,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل في إرسال الهدية");
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`تم إرسال ${selectedGift.emoji} ${selectedGift.name} بنجاح!`);
        setSelectedGift(null);
        setAmount(1);
        
        // استدعاء الدالة الخارجية
        if (onSend) {
          onSend(data);
        }

        // إخفاء رسالة النجاح بعد 3 ثواني
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ["all", "basic", "premium", "special", "seasonal"];
  const categoryLabels = {
    all: "الكل",
    basic: "أساسي",
    premium: "متميز",
    special: "خاص",
    seasonal: "موسمي"
  };

  return (
    <div className="advanced-gift-picker">
      <div className="gift-picker-header">
        <h3>🎁 اختر هدية</h3>
        <div className="balance-display">
          <span className="balance-label">رصيدك:</span>
          <span className="balance-amount">{userBalance} 💰</span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* فلاتر الفئات */}
      <div className="category-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* شبكة الهدايا */}
      <div className="gifts-grid">
        {filteredGifts.map(gift => (
          <div
            key={gift.id}
            className={`gift-card ${selectedGift?.id === gift.id ? "selected" : ""}`}
            onClick={() => setSelectedGift(gift)}
          >
            <div className="gift-emoji">{gift.emoji}</div>
            <div className="gift-name">{gift.name}</div>
            <div className="gift-price">
              <span className="coins">{gift.coins}</span>
              <span className="coin-icon">💰</span>
            </div>
            {gift.description && (
              <div className="gift-description">{gift.description}</div>
            )}
          </div>
        ))}
      </div>

      {/* تفاصيل الهدية المختارة */}
      {selectedGift && (
        <div className="selected-gift-details">
          <div className="gift-preview">
            <span className="large-emoji">{selectedGift.emoji}</span>
            <div className="gift-info">
              <h4>{selectedGift.name}</h4>
              <p className="category-badge">{categoryLabels[selectedGift.category]}</p>
              {selectedGift.description && (
                <p className="description">{selectedGift.description}</p>
              )}
            </div>
          </div>

          {/* اختيار الكمية */}
          <div className="amount-selector">
            <label>الكمية:</label>
            <div className="amount-controls">
              <button
                className="amount-btn"
                onClick={() => setAmount(Math.max(1, amount - 1))}
                disabled={amount <= 1}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="amount-input"
              />
              <button
                className="amount-btn"
                onClick={() => setAmount(amount + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* حساب التكلفة */}
          <div className="cost-summary">
            <div className="cost-row">
              <span>السعر الواحد:</span>
              <span>{selectedGift.coins} 💰</span>
            </div>
            <div className="cost-row">
              <span>الكمية:</span>
              <span>{amount}</span>
            </div>
            <div className="cost-row total">
              <span>الإجمالي:</span>
              <span>{selectedGift.coins * amount} 💰</span>
            </div>
            {userBalance < selectedGift.coins * amount && (
              <div className="insufficient-balance">
                ⚠️ رصيد غير كافي
              </div>
            )}
          </div>

          {/* زر الإرسال */}
          <button
            className="send-gift-btn"
            onClick={handleSendGift}
            disabled={isLoading || userBalance < selectedGift.coins * amount}
          >
            {isLoading ? "جاري الإرسال..." : `إرسال ${selectedGift.emoji}`}
          </button>
        </div>
      )}
    </div>
  );
}
