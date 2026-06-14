import { useState } from 'react';
import SettingsShell, { SettingsSection, SettingsRow, SettingsToggle } from '../../components/settings/SettingsShell.jsx';
import Button from '../../components/ui/Button.jsx';

const KEY = 'yamshat:wallet-settings';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

export default function WalletSettingsPage() {
  const [prefs, setPrefs] = useState(() => ({
    pinEnabled: true,
    biometricEnabled: true,
    requirePinForPayments: true,
    requirePinAboveAmount: true,
    pinAmountThreshold: 100,
    defaultCurrency: 'USD',
    showBalance: true,
    hideBalanceOnAppOpen: false,
    autoConvertCurrency: true,
    dailyLimit: 1000,
    monthlyLimit: 10000,
    transactionAlerts: true,
    receiveTipsAllowed: true,
    sendTipsAllowed: true,
    allowGifts: true,
    autoTopupEnabled: false,
    autoTopupAmount: 50,
    twoFactorPayments: true,
    receiptsEmail: true,
    transactionHistory: '90days',
    preferredPaymentMethod: 'card',
    paypalLinked: false,
    cardLinked: false,
    walletLinked: true,
    cryptoEnabled: false,
    refundPolicy: 'auto',
    ...load(),
  }));
  const [msg, setMsg] = useState('');

  const u = (k, v) => {
    const n = { ...prefs, [k]: v };
    setPrefs(n); save(n);
    setMsg('تم الحفظ.');
    setTimeout(() => setMsg(''), 1500);
  };

  return (
    <SettingsShell title="إعدادات المحفظة" subtitle="أمان الدفعات، عملات، حدود، وطرق دفع." icon="💰" backTo="/wallet" message={msg}>
      <SettingsSection title="الأمان والمدفوعات">
        <SettingsRow icon="🔐" title="رمز PIN للمحفظة">
          <SettingsToggle on={prefs.pinEnabled} onChange={(v) => u('pinEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="👆" title="بصمة الإصبع / Face ID">
          <SettingsToggle on={prefs.biometricEnabled} onChange={(v) => u('biometricEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="💳" title="طلب PIN لكل عملية دفع">
          <SettingsToggle on={prefs.requirePinForPayments} onChange={(v) => u('requirePinForPayments', v)} />
        </SettingsRow>
        <SettingsRow icon="🔒" title="طلب PIN للمبالغ الكبيرة فقط">
          <SettingsToggle on={prefs.requirePinAboveAmount} onChange={(v) => u('requirePinAboveAmount', v)} />
        </SettingsRow>
        {prefs.requirePinAboveAmount ? (
          <SettingsRow icon="💵" title="حد المبلغ الكبير (بالعملة الأساسية)">
            <input className="settings-input" type="number" value={prefs.pinAmountThreshold} onChange={(e) => u('pinAmountThreshold', Number(e.target.value))} />
          </SettingsRow>
        ) : null}
        <SettingsRow icon="🛡️" title="مصادقة ثنائية لكل عملية">
          <SettingsToggle on={prefs.twoFactorPayments} onChange={(v) => u('twoFactorPayments', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="العملة والرصيد">
        <SettingsRow icon="💱" title="العملة الافتراضية">
          <select className="settings-select" value={prefs.defaultCurrency} onChange={(e) => u('defaultCurrency', e.target.value)}>
            <option value="USD">دولار أمريكي USD</option>
            <option value="EUR">يورو EUR</option>
            <option value="SAR">ريال سعودي SAR</option>
            <option value="AED">درهم إماراتي AED</option>
            <option value="EGP">جنيه مصري EGP</option>
            <option value="KWD">دينار كويتي KWD</option>
            <option value="QAR">ريال قطري QAR</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="👁️" title="إظهار الرصيد">
          <SettingsToggle on={prefs.showBalance} onChange={(v) => u('showBalance', v)} />
        </SettingsRow>
        <SettingsRow icon="🙈" title="إخفاء الرصيد عند فتح التطبيق">
          <SettingsToggle on={prefs.hideBalanceOnAppOpen} onChange={(v) => u('hideBalanceOnAppOpen', v)} />
        </SettingsRow>
        <SettingsRow icon="🔄" title="تحويل العملات تلقائيًا">
          <SettingsToggle on={prefs.autoConvertCurrency} onChange={(v) => u('autoConvertCurrency', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الحدود اليومية والشهرية" description="حماية إضافية بضبط حدود الإنفاق">
        <SettingsRow icon="📅" title="الحد اليومي">
          <input className="settings-input" type="number" value={prefs.dailyLimit} onChange={(e) => u('dailyLimit', Number(e.target.value))} />
        </SettingsRow>
        <SettingsRow icon="📆" title="الحد الشهري">
          <input className="settings-input" type="number" value={prefs.monthlyLimit} onChange={(e) => u('monthlyLimit', Number(e.target.value))} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الإكراميات والهدايا">
        <SettingsRow icon="🎁" title="السماح باستلام إكراميات">
          <SettingsToggle on={prefs.receiveTipsAllowed} onChange={(v) => u('receiveTipsAllowed', v)} />
        </SettingsRow>
        <SettingsRow icon="💝" title="السماح بإرسال إكراميات">
          <SettingsToggle on={prefs.sendTipsAllowed} onChange={(v) => u('sendTipsAllowed', v)} />
        </SettingsRow>
        <SettingsRow icon="🎀" title="السماح بالهدايا الافتراضية">
          <SettingsToggle on={prefs.allowGifts} onChange={(v) => u('allowGifts', v)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="طرق الدفع">
        <SettingsRow icon="💳" title="بطاقة ائتمان" description={prefs.cardLinked ? 'مرتبطة' : 'غير مرتبطة'}>
          <Button variant="secondary" size="small">{prefs.cardLinked ? 'إدارة' : 'ربط'}</Button>
        </SettingsRow>
        <SettingsRow icon="🅿️" title="PayPal" description={prefs.paypalLinked ? 'مرتبطة' : 'غير مرتبطة'}>
          <Button variant="secondary" size="small">{prefs.paypalLinked ? 'إدارة' : 'ربط'}</Button>
        </SettingsRow>
        <SettingsRow icon="🪙" title="عملات رقمية (Crypto)">
          <SettingsToggle on={prefs.cryptoEnabled} onChange={(v) => u('cryptoEnabled', v)} />
        </SettingsRow>
        <SettingsRow icon="⭐" title="طريقة الدفع المفضلة">
          <select className="settings-select" value={prefs.preferredPaymentMethod} onChange={(e) => u('preferredPaymentMethod', e.target.value)}>
            <option value="wallet">المحفظة</option>
            <option value="card">بطاقة</option>
            <option value="paypal">PayPal</option>
            <option value="crypto">عملات رقمية</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الإشعارات والسجلات">
        <SettingsRow icon="🔔" title="تنبيهات لكل معاملة">
          <SettingsToggle on={prefs.transactionAlerts} onChange={(v) => u('transactionAlerts', v)} />
        </SettingsRow>
        <SettingsRow icon="📧" title="إرسال الإيصالات بالبريد">
          <SettingsToggle on={prefs.receiptsEmail} onChange={(v) => u('receiptsEmail', v)} />
        </SettingsRow>
        <SettingsRow icon="📜" title="فترة سجل المعاملات">
          <select className="settings-select" value={prefs.transactionHistory} onChange={(e) => u('transactionHistory', e.target.value)}>
            <option value="30days">30 يوم</option>
            <option value="90days">90 يوم</option>
            <option value="1year">سنة</option>
            <option value="all">الكل</option>
          </select>
        </SettingsRow>
        <SettingsRow icon="↩️" title="سياسة استرداد المبالغ">
          <select className="settings-select" value={prefs.refundPolicy} onChange={(e) => u('refundPolicy', e.target.value)}>
            <option value="auto">تلقائي</option>
            <option value="manual">يدوي</option>
            <option value="ask">السؤال في كل مرة</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="الشحن التلقائي">
        <SettingsRow icon="⚡" title="شحن تلقائي عند نفاد الرصيد">
          <SettingsToggle on={prefs.autoTopupEnabled} onChange={(v) => u('autoTopupEnabled', v)} />
        </SettingsRow>
        {prefs.autoTopupEnabled ? (
          <SettingsRow icon="💰" title="مبلغ الشحن التلقائي">
            <input className="settings-input" type="number" value={prefs.autoTopupAmount} onChange={(e) => u('autoTopupAmount', Number(e.target.value))} />
          </SettingsRow>
        ) : null}
      </SettingsSection>

      <SettingsSection title="إجراءات">
        <SettingsRow icon="📥" title="تنزيل سجل المعاملات (CSV)">
          <Button variant="secondary" size="small" onClick={() => { setMsg('جاري التحضير...'); setTimeout(() => setMsg(''), 1500); }}>تنزيل</Button>
        </SettingsRow>
        <SettingsRow icon="🔒" title="تجميد المحفظة مؤقتًا">
          <Button variant="secondary" size="small" className="settings-danger">تجميد</Button>
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  );
}
