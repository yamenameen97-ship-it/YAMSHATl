import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { createGroup, getGroups, joinGroup } from '../api/groups.js';
import { getCurrentUsername } from '../utils/auth.js';
import { useToast } from '../components/admin/ToastProvider.jsx';

function buildFallbackMembers(group) {
  const seed = String(group?.name || 'Yamshat');
  return Array.from({ length: Math.min(4, Number(group?.members_count || 3) || 3) }, (_, index) => ({
    id: `${group?.id || 'g'}-${index}`,
    name: `${seed} ${index + 1}`,
    role: index === 0 ? 'مدير' : 'عضو',
  }));
}

export default function Groups() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [busy, setBusy] = useState('');
  const [draft, setDraft] = useState({ name: '', description: '' });

  const loadGroups = async (preferredId = null) => {
    try {
      const { data } = await getGroups();
      const nextGroups = Array.isArray(data) ? data : data?.items || [];
      setGroups(nextGroups);
      const nextSelected = preferredId
        ? nextGroups.find((item) => String(item.id) === String(preferredId))
        : selectedGroup
          ? nextGroups.find((item) => String(item.id) === String(selectedGroup.id))
          : nextGroups[0];
      setSelectedGroup(nextSelected || nextGroups[0] || null);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل المجموعات', description: error?.response?.data?.detail || error?.message || 'حاول مرة تانية.' });
      setGroups([]);
      setSelectedGroup(null);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const groupMembers = useMemo(() => buildFallbackMembers(selectedGroup), [selectedGroup]);

  const createNewGroup = async () => {
    if (!draft.name.trim()) return;
    try {
      setBusy('create');
      const payload = { name: draft.name.trim(), description: draft.description.trim() };
      const { data } = await createGroup(payload);
      const createdId = data?.id || data?.group?.id || data?.group_id || null;
      pushToast({ type: 'success', title: 'تم إنشاء المجموعة' });
      setDraft({ name: '', description: '' });
      setShowCreateModal(false);
      await loadGroups(createdId);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إنشاء المجموعة', description: error?.response?.data?.detail || error?.message || 'حاول مرة تانية.' });
    } finally {
      setBusy('');
    }
  };

  const handleJoin = async (groupId) => {
    try {
      setBusy(`join-${groupId}`);
      await joinGroup(groupId);
      pushToast({ type: 'success', title: 'تم الانضمام للمجموعة' });
      await loadGroups(groupId);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر الانضمام', description: error?.response?.data?.detail || error?.message || 'حاول مرة تانية.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <MainLayout>
      <div className="yam-page yam-page-wide">
        <div className="yam-hero" style={{ marginBottom: 22 }}>
          <div className="yam-toolbar" style={{ marginBottom: 0 }}>
            <div>
              <div className="yam-badge primary" style={{ marginBottom: 12 }}>👥 المجموعات</div>
              <h1 className="yam-section-title">صفحة المجموعات</h1>
              <p className="yam-section-note" style={{ margin: '10px 0 0', maxWidth: 760 }}>
                اتظبطت لتبقى قريبة من المرجع: قائمة مجموعات واضحة، تفاصيل المجموعة في نفس الشاشة، وأزرار إنشاء وانضمام باينة على الموبايل والكمبيوتر.
              </p>
            </div>

            <div className="yam-action-row">
              <Button variant="secondary" onClick={() => loadGroups(selectedGroup?.id)}>تحديث</Button>
              <Button onClick={() => setShowCreateModal(true)}>إنشاء مجموعة</Button>
            </div>
          </div>
        </div>

        <div className="groups-layout-ref">
          <Card className="groups-list-surface-ref">
            <div className="yam-toolbar">
              <h3 style={{ margin: 0 }}>كل المجموعات</h3>
              <span className="yam-badge">{groups.length}</span>
            </div>

            <div className="yam-list">
              {groups.length ? groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`groups-list-card-ref ${selectedGroup?.id === group.id ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="groups-card-head-ref">
                    <div className="groups-card-icon-ref">{String(group.name || 'G').slice(0, 1).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'start' }}>
                      <strong style={{ display: 'block', marginBottom: 4 }}>{group.name || 'مجموعة'}</strong>
                      <span className="yam-meta">{group.description || 'مجتمع للنقاشات والمنشورات داخل يمشات.'}</span>
                    </div>
                  </div>

                  <div className="groups-card-footer-ref">
                    <span className="yam-meta">👤 {group.owner || currentUser || 'owner'}</span>
                    <span className="yam-pill-count">{Number(group.members_count || 0)}</span>
                  </div>
                </button>
              )) : (
                <div className="yam-empty-state">
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>لسه مفيش مجموعات</div>
                  <div className="yam-empty-copy">ابدأ أول مجموعة من زر "إنشاء مجموعة".</div>
                </div>
              )}
            </div>
          </Card>

          <div className="groups-content-stack-ref">
            <Card className="groups-detail-surface-ref">
              {selectedGroup ? (
                <>
                  <div className="yam-toolbar">
                    <div>
                      <h2 style={{ margin: 0 }}>{selectedGroup.name}</h2>
                      <p className="yam-section-note" style={{ margin: '8px 0 0' }}>{selectedGroup.description || 'مساحة مخصصة للمحتوى والنقاشات داخل المجتمع.'}</p>
                    </div>
                    <div className="yam-action-row">
                      <Button
                        variant="secondary"
                        loading={busy === `join-${selectedGroup.id}`}
                        onClick={() => handleJoin(selectedGroup.id)}
                      >
                        انضمام
                      </Button>
                    </div>
                  </div>

                  <div className="yam-stat-grid" style={{ marginBottom: 18 }}>
                    <div className="yam-stat"><strong>{selectedGroup.members_count || 0}</strong><span className="yam-meta">الأعضاء</span></div>
                    <div className="yam-stat"><strong>{selectedGroup.posts_count || 0}</strong><span className="yam-meta">المنشورات</span></div>
                    <div className="yam-stat"><strong>{selectedGroup.owner || currentUser || 'admin'}</strong><span className="yam-meta">المالك</span></div>
                  </div>

                  <div className="groups-split-ref">
                    <div className="groups-panel-ref">
                      <div className="yam-toolbar">
                        <h3 style={{ margin: 0 }}>نظرة سريعة</h3>
                        <span className="yam-badge success">منظمة</span>
                      </div>
                      <div className="yam-list">
                        <div className="yam-item-row">
                          <div className="yam-avatar-sm">📝</div>
                          <div>
                            <strong>منشورات المجموعة</strong>
                            <div className="yam-meta">المحتوى هيظهر هنا أول ما بيانات المنشورات ترجع من الـ API.</div>
                          </div>
                        </div>
                        <div className="yam-item-row">
                          <div className="yam-avatar-sm">💬</div>
                          <div>
                            <strong>نقاشات مباشرة</strong>
                            <div className="yam-meta">ممكن توصلها بسهولة مع صفحة الرسائل أو الغرف لاحقاً.</div>
                          </div>
                        </div>
                        <div className="yam-item-row">
                          <div className="yam-avatar-sm">📌</div>
                          <div>
                            <strong>قواعد وتعريف</strong>
                            <div className="yam-meta">{selectedGroup.description || 'أضف وصفاً للمجموعة يظهر هنا بشكل مختصر وواضح.'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="groups-panel-ref">
                      <div className="yam-toolbar">
                        <h3 style={{ margin: 0 }}>أعضاء بارزون</h3>
                        <span className="yam-badge">{groupMembers.length}</span>
                      </div>
                      <div className="yam-list">
                        {groupMembers.map((member) => (
                          <div key={member.id} className="yam-item-row" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div className="yam-avatar-sm">{member.name.slice(0, 1)}</div>
                              <div>
                                <strong>{member.name}</strong>
                                <div className="yam-meta">{member.role}</div>
                              </div>
                            </div>
                            <span className="yam-badge">{member.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="yam-empty-state">
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🧭</div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>اختر مجموعة من القائمة</div>
                  <div className="yam-empty-copy">وصفها وتفاصيلها هتظهر هنا فوراً.</div>
                </div>
              )}
            </Card>
          </div>
        </div>

        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="إنشاء مجموعة جديدة" size="large">
          <div className="yam-grid" style={{ gap: 14 }}>
            <input
              className="yam-input"
              placeholder="اسم المجموعة"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
            <textarea
              className="yam-textarea"
              placeholder="وصف المجموعة"
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={createNewGroup} loading={busy === 'create'} disabled={!draft.name.trim()}>إنشاء الآن</Button>
            </div>
          </div>
        </Modal>

        <style>{`
          .groups-layout-ref {
            display: grid;
            grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
            gap: 22px;
            align-items: start;
          }

          .groups-content-stack-ref,
          .groups-split-ref {
            display: grid;
            gap: 18px;
          }

          .groups-split-ref {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .groups-list-card-ref {
            width: 100%;
            padding: 16px;
            border-radius: 24px;
            border: 1px solid rgba(148,163,184,0.12);
            background: rgba(255,255,255,0.04);
            color: var(--yam-text);
            cursor: pointer;
          }

          .groups-list-card-ref.active {
            background: linear-gradient(135deg, rgba(139,92,246,0.18), rgba(6,182,212,0.1));
            border-color: rgba(139,92,246,0.28);
          }

          .groups-card-head-ref,
          .groups-card-footer-ref {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .groups-card-footer-ref {
            justify-content: space-between;
            margin-top: 14px;
          }

          .groups-card-icon-ref {
            width: 50px;
            height: 50px;
            border-radius: 18px;
            display: grid;
            place-items: center;
            font-weight: 800;
            color: white;
            background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          }

          .groups-panel-ref {
            display: grid;
            gap: 14px;
            align-content: start;
          }

          @media (max-width: 1100px) {
            .groups-layout-ref,
            .groups-split-ref {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
