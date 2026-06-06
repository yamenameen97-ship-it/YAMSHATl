from pydantic import BaseModel
from typing import Optional

class WalletUpdate(BaseModel):
    amount: float
    payment_token: Optional[str] = None  # For deposits
    payout_method: Optional[str] = None  # For withdrawals

class TransactionCreate(BaseModel):
    user_id: int
    amount: int
    type: str  # e.g., 'coin_purchase', 'gift_sent', 'payout'
    description: Optional[str] = None
