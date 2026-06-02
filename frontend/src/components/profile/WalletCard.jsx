import React from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import './WalletCard.css';

const WalletCard = ({ balance = 0, currency = 'SAR' }) => {
  return (
    <Card className="wallet-card">
      <div className="wallet-content">
        <div className="wallet-header">
          <span className="wallet-icon">💰</span>
          <h3>المحفظة الرقمية</h3>
        </div>
        <div className="wallet-balance-section">
          <p className="balance-label">الرصيد الحالي</p>
          <div className="balance-amount">
            <span className="amount">{balance.toLocaleString()}</span>
            <span className="currency">{currency}</span>
          </div>
        </div>
        <div className="wallet-actions">
          <Button size="small" variant="primary">شحن الرصيد</Button>
          <Button size="small" variant="secondary">سجل العمليات</Button>
        </div>
      </div>
    </Card>
  );
};

export default WalletCard;
