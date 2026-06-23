import React from 'react';
import { useNavigate } from 'react-router-dom';

const GroupSubHeader = ({ title, subtitle, action = null, onBack = null }) => {
  const navigate = useNavigate();
  return (
    <div className="yamg-toolbar" dir="rtl">
      <button
        type="button"
        className="yamg-back"
        onClick={() => (onBack ? onBack() : navigate(-1))}
        aria-label="رجوع"
      >→</button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 className="yamg-title">{title}</h2>
        {subtitle && <p className="yamg-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
};

export default GroupSubHeader;
