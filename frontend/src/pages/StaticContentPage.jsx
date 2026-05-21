import MainLayout from '../components/layout/MainLayoutEnhanced.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { Link } from 'react-router-dom';

export default function StaticContentPage({
  title = 'صفحة معلومات',
  subtitle = '',
  sections = [],
  ctaLabel = 'العودة للرئيسية',
  ctaTo = '/',
}) {
  return (
    <MainLayoutEnhanced hideNav>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 12px 96px', direction: 'rtl' }}>
        <Card style={{ padding: 22, marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="muted">YAMSHAT</div>
            <h1 style={{ margin: 0 }}>{title}</h1>
            {subtitle ? <p className="muted" style={{ margin: 0, lineHeight: 1.8 }}>{subtitle}</p> : null}
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 16 }}>
          {sections.map((section, index) => (
            <Card key={`${section.heading}-${index}`} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{section.heading}</h2>
                {Array.isArray(section.items) && section.items.length ? (
                  <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.9 }}>
                    {section.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}
                  </ul>
                ) : (
                  <p style={{ margin: 0, lineHeight: 1.9 }}>{section.content || ''}</p>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to={ctaTo} style={{ textDecoration: 'none' }}>
            <Button>{ctaLabel}</Button>
          </Link>
          <Link to="/settings" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">الإعدادات</Button>
          </Link>
        </div>
      </div>
    </MainLayoutEnhanced>
  );
}
