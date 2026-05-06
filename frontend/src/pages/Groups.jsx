import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { createGroup, getGroups, joinGroup } from '../api/groups.js';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', members: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await getGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل المجموعات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError('اكتب اسم المجموعة أولاً.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await createGroup({
        name: form.name.trim(),
        description: form.description.trim(),
        members: form.members.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setForm({ name: '', description: '', members: '' });
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر إنشاء المجموعة.');
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (groupId) => {
    try {
      await joinGroup(groupId);
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر الانضمام للمجموعة.');
    }
  };

  return (
    <MainLayout>
      <section className="feed-layout">
        <div className="feed-main">
          <Card className="composer-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">👥 المجموعات</h3>
                <p className="muted">إنشاء مجموعات ويب خفيفة وقابلة للانضمام مباشرة من الواجهة.</p>
              </div>
            </div>
            <Input label="اسم المجموعة" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            <Input label="وصف المجموعة" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            <Input label="الأعضاء المبدئيون" hint="افصل الأسماء بفاصلة" value={form.members} onChange={(e) => setForm((prev) => ({ ...prev, members: e.target.value }))} />
            <div className="composer-actions">
              <Button onClick={handleCreate} disabled={saving}>{saving ? 'جارٍ الإنشاء...' : 'إنشاء المجموعة'}</Button>
            </div>
          </Card>

          {error ? <div className="alert error">{error}</div> : null}
          {loading ? <div className="empty-state">جارٍ تحميل المجموعات...</div> : null}

          <div className="feed-stack">
            {groups.map((group) => (
              <Card key={group.id} className="post-card">
                <div className="post-head">
                  <div>
                    <strong>{group.name}</strong>
                    <div className="muted">بواسطة {group.owner_username}</div>
                  </div>
                  <button type="button" className="mini-action" onClick={() => handleJoin(group.id)}>انضمام</button>
                </div>
                <p className="post-text">{group.description || 'بدون وصف'}</p>
                <div className="post-social-meta">
                  <span>👥 {group.members_count} أعضاء</span>
                  <span>🕒 {group.created_at ? new Date(group.created_at).toLocaleString('ar-EG') : 'الآن'}</span>
                </div>
                <div className="comment-list">
                  {group.members?.map((member) => (
                    <div key={`${group.id}-${member}`} className="comment-item">
                      <b>@</b>
                      <span>{member}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
            {!loading && groups.length === 0 ? <div className="empty-state">لا توجد مجموعات بعد. ابدأ أول مجموعة من الأعلى.</div> : null}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
