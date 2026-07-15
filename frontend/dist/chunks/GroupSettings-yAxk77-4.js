import { bx as useNavigate, bz as useParams, bE as useToast, b0 as reactExports, as as jsxRuntimeExports, h as MainLayout } from "../index-D_Nx8mZz.js";
import { M as updateGroupSettings, K as updateGroup, G as removeMember, N as updateMemberRole, J as transferOwnership, m as generateGroupInvite, a as addMember, h as deleteGroup, p as getGroupDetails, q as getGroupMembers, n as getGroupAnalytics, O as uploadGroupImage } from "./groups-BgR9_Dnk.js";
const GroupSettings = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { pushToast } = useToast();
  const avatarInputRef = reactExports.useRef(null);
  const coverInputRef = reactExports.useRef(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [saving, setSaving] = reactExports.useState(false);
  const [uploading, setUploading] = reactExports.useState(false);
  const [privacy, setPrivacy] = reactExports.useState("public");
  const [permissions, setPermissions] = reactExports.useState({
    canPost: true,
    canComment: true,
    canUpload: true,
    canLive: true,
    requireApproval: false,
    blockExternalLinks: false
  });
  const [searchMember, setSearchMember] = reactExports.useState("");
  const [showMore, setShowMore] = reactExports.useState(false);
  const [members, setMembers] = reactExports.useState([]);
  const [groupInfo, setGroupInfo] = reactExports.useState({
    name: "المجموعة",
    description: "",
    membersCount: 0,
    createdAt: "",
    image_url: "",
    cover_image_url: "",
    invite_link: ""
  });
  const [stats, setStats] = reactExports.useState({
    posts: "—",
    comments: "—",
    activity: "—"
  });
  reactExports.useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [detailsRes, membersRes, analyticsRes] = await Promise.allSettled([
          getGroupDetails(groupId),
          getGroupMembers(groupId),
          getGroupAnalytics(groupId)
        ]);
        if (!cancelled && detailsRes.status === "fulfilled") {
          const data = detailsRes.value.data?.group || detailsRes.value.data || {};
          setGroupInfo({
            name: data.name || data.title || "المجموعة",
            description: data.description || data.bio || "",
            membersCount: data.members_count || data.members?.length || 0,
            createdAt: data.created_at ? new Date(data.created_at).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear(),
            image_url: data.image_url || data.icon || "",
            cover_image_url: data.cover_image_url || "",
            invite_link: data.invite_link || `${window.location.origin}/g/${groupId}`,
            privacy: data.privacy || "public",
            posts_count: data.posts_count || 0
          });
          if (data.privacy) setPrivacy(data.privacy);
          if (data.posts_count !== void 0) {
            setStats((s) => ({ ...s, posts: data.posts_count }));
          }
        }
        if (!cancelled && membersRes.status === "fulfilled") {
          const list = Array.isArray(membersRes.value.data) ? membersRes.value.data : membersRes.value.data?.items || membersRes.value.data?.members || [];
          const mapped = list.map((m, idx) => ({
            id: m.id || m.user_id || idx,
            name: m.display_name || m.user_name || m.name || m.username,
            username: m.username ? `@${m.username}` : m.user_id ? `@${m.user_id}` : "",
            role: m.role || "member",
            avatar: m.user_avatar || m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username || m.user_id || idx}`
          }));
          setMembers(mapped);
        }
        if (!cancelled && analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
          const a = analyticsRes.value.data;
          setStats((s) => ({
            posts: a.posts_count ?? s.posts,
            comments: a.comments_count ?? s.comments,
            activity: a.activity_score ?? s.activity
          }));
        }
      } catch (err) {
        console.error("Failed to load group data:", err);
        pushToast?.({ type: "error", title: "خطأ", description: "تعذر تحميل بيانات المجموعة" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [groupId, pushToast]);
  const togglePermission = reactExports.useCallback((key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const handleSavePermissions = reactExports.useCallback(async () => {
    setSaving(true);
    try {
      await updateGroupSettings(groupId, { permissions });
      pushToast?.({ type: "success", title: "تم", description: "تم حفظ الصلاحيات بنجاح" });
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "فشل حفظ الصلاحيات" });
    } finally {
      setSaving(false);
    }
  }, [groupId, permissions, pushToast]);
  const handleSavePrivacy = reactExports.useCallback(async () => {
    setSaving(true);
    try {
      await updateGroup(groupId, { privacy, is_public: privacy === "public" });
      pushToast?.({ type: "success", title: "تم", description: "تم تحديث إعدادات الخصوصية" });
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "فشل تحديث الخصوصية" });
    } finally {
      setSaving(false);
    }
  }, [groupId, privacy, pushToast]);
  const handleEditMember = reactExports.useCallback(async (memberId, action) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    const usernameClean = (member.username || "").replace(/^@/, "");
    if (action === "remove") {
      if (!window.confirm(`هل تريد إزالة ${member.name} من المجموعة؟`)) return;
      try {
        await removeMember(groupId, usernameClean);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        pushToast?.({ type: "success", title: "تم", description: `تم إزالة ${member.name}` });
      } catch {
        pushToast?.({ type: "error", title: "خطأ", description: "فشل إزالة العضو" });
      }
    } else if (action === "promote") {
      const newRole = member.role === "member" ? "moderator" : "admin";
      try {
        await updateMemberRole(groupId, usernameClean, newRole);
        setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
        pushToast?.({ type: "success", title: "تم", description: `تم ترقية ${member.name} إلى ${newRole === "admin" ? "مشرف" : "مراقب"}` });
      } catch {
        pushToast?.({ type: "error", title: "خطأ", description: "فشل ترقية العضو" });
      }
    } else if (action === "demote") {
      const newRole = member.role === "admin" ? "moderator" : "member";
      try {
        await updateMemberRole(groupId, usernameClean, newRole);
        setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
        pushToast?.({ type: "success", title: "تم", description: `تم خفض رتبة ${member.name}` });
      } catch {
        pushToast?.({ type: "error", title: "خطأ", description: "فشل العملية" });
      }
    } else if (action === "transfer") {
      if (!window.confirm(`هل أنت متأكد من نقل ملكية المجموعة إلى ${member.name}؟ ستفقد صلاحيات المالك.`)) return;
      try {
        await transferOwnership(groupId, usernameClean);
        setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: "owner" } : m));
        pushToast?.({ type: "success", title: "تم", description: `تم نقل الملكية إلى ${member.name}` });
      } catch {
        pushToast?.({ type: "error", title: "خطأ", description: "فشل نقل الملكية" });
      }
    }
  }, [members, groupId, pushToast]);
  const handleCopyLink = reactExports.useCallback(() => {
    const link = groupInfo.invite_link || `${window.location.origin}/g/${groupId}`;
    navigator.clipboard.writeText(link);
    pushToast?.({ type: "success", title: "تم", description: "تم نسخ الرابط" });
  }, [groupInfo.invite_link, groupId, pushToast]);
  const handleShareLink = reactExports.useCallback(() => {
    const link = groupInfo.invite_link || `${window.location.origin}/g/${groupId}`;
    if (navigator.share) {
      navigator.share({ title: groupInfo.name, text: "انضم إلى مجموعتنا", url: link }).catch(() => {
      });
    } else {
      navigator.clipboard.writeText(link);
      pushToast?.({ type: "info", title: "تم النسخ", description: "تم نسخ الرابط للمشاركة" });
    }
  }, [groupInfo, groupId, pushToast]);
  const handleNewInvite = reactExports.useCallback(async () => {
    try {
      const res = await generateGroupInvite(groupId);
      const link = res.data?.link || res.data?.invite_link;
      if (link) {
        setGroupInfo((prev) => ({ ...prev, invite_link: link }));
        pushToast?.({ type: "success", title: "تم", description: "تم إنشاء رابط جديد" });
      }
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "فشل إنشاء الرابط" });
    }
  }, [groupId, pushToast]);
  const handleEditInfo = reactExports.useCallback(async () => {
    const newName = window.prompt("اسم المجموعة الجديد:", groupInfo.name);
    if (!newName || newName === groupInfo.name) return;
    const newDesc = window.prompt("الوصف الجديد:", groupInfo.description);
    try {
      await updateGroup(groupId, { name: newName, description: newDesc });
      setGroupInfo((prev) => ({ ...prev, name: newName, description: newDesc ?? prev.description }));
      pushToast?.({ type: "success", title: "تم", description: "تم تحديث المعلومات" });
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "فشل تحديث المعلومات" });
    }
  }, [groupId, groupInfo, pushToast]);
  const onImageSelected = async (e, kind) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      pushToast?.({ type: "warning", title: "الصورة كبيرة", description: "الحد الأقصى 5 ميجابايت" });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadGroupImage(groupId, file, kind);
      setGroupInfo((prev) => kind === "cover" ? { ...prev, cover_image_url: url } : { ...prev, image_url: url });
      pushToast?.({ type: "success", title: "تم", description: kind === "cover" ? "تم تحديث الغلاف" : "تم تحديث الصورة" });
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: kind === "cover" ? "فشل تحديث الغلاف" : "فشل تحديث الصورة" });
    } finally {
      setUploading(false);
    }
  };
  const handleChangeAvatar = reactExports.useCallback(() => avatarInputRef.current?.click(), []);
  const handleChangeCover = reactExports.useCallback(() => coverInputRef.current?.click(), []);
  const handleAddMember = reactExports.useCallback(async () => {
    const username = window.prompt("اسم المستخدم لإضافته للمجموعة:");
    if (!username || !username.trim()) return;
    const u = username.trim().replace(/^@/, "");
    try {
      await addMember(groupId, { user_id: u, user_name: u, user_avatar: "" });
      setMembers((prev) => [
        ...prev,
        {
          id: u,
          name: u,
          username: `@${u}`,
          role: "member",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u}`
        }
      ]);
      pushToast?.({ type: "success", title: "تم", description: `تم إضافة @${u}` });
    } catch (e) {
      pushToast?.({ type: "error", title: "خطأ", description: e?.response?.data?.detail || "فشل إضافة العضو" });
    }
  }, [groupId, pushToast]);
  const handleDeleteGroup = reactExports.useCallback(async () => {
    if (!window.confirm("هل أنت متأكد من حذف المجموعة؟ لا يمكن التراجع عن هذا الإجراء")) return;
    if (!window.confirm("هذا الإجراء نهائي. هل تريد المتابعة؟")) return;
    setSaving(true);
    try {
      await deleteGroup(groupId);
      pushToast?.({ type: "success", title: "تم", description: "تم حذف المجموعة" });
      navigate("/groups");
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "فشل حذف المجموعة" });
    } finally {
      setSaving(false);
    }
  }, [groupId, navigate, pushToast]);
  const handleArchiveGroup = reactExports.useCallback(async () => {
    if (!window.confirm("هل تريد أرشفة المجموعة؟")) return;
    setSaving(true);
    try {
      await updateGroup(groupId, { archived: true });
      pushToast?.({ type: "success", title: "تم", description: "تم أرشفة المجموعة" });
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "فشل أرشفة المجموعة" });
    } finally {
      setSaving(false);
    }
  }, [groupId, pushToast]);
  const handleTransferOwnershipPrompt = reactExports.useCallback(async () => {
    const username = window.prompt("اسم المستخدم الجديد للمالك (يجب أن يكون عضواً):");
    if (!username || !username.trim()) return;
    const u = username.trim().replace(/^@/, "");
    if (!window.confirm(`هل أنت متأكد من نقل ملكية المجموعة إلى @${u}؟`)) return;
    try {
      await transferOwnership(groupId, u);
      pushToast?.({ type: "success", title: "تم", description: `تم نقل الملكية إلى @${u}` });
      setMembers((prev) => prev.map((m) => (m.username || "").replace(/^@/, "") === u ? { ...m, role: "owner" } : m));
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "فشل نقل الملكية" });
    }
  }, [groupId, pushToast]);
  const inviteLink = groupInfo.invite_link || `${window.location.origin}/g/${groupId}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}`;
  const filteredMembers = searchMember ? members.filter(
    (m) => (m.name || "").toLowerCase().includes(searchMember.toLowerCase()) || (m.username || "").toLowerCase().includes(searchMember.toLowerCase())
  ) : members;
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "yam-group-settings-page",
        dir: "rtl",
        style: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8" }, children: "جاري تحميل الإعدادات..." })
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "yam-group-settings-page",
      dir: "rtl",
      style: { fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: avatarInputRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: (e) => onImageSelected(e, "avatar") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: coverInputRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: (e) => onImageSelected(e, "cover") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-settings-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yam-back-btn", onClick: () => navigate(`/groups/${groupId}/chat`), "aria-label": "رجوع", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "20px" }, children: "❮" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "إعدادات المجموعة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yam-more-options-btn", onClick: () => setShowMore((v) => !v), "aria-label": "المزيد", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "20px" }, children: "⋮" }) }),
            showMore && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                style: {
                  position: "absolute",
                  insetInlineEnd: 0,
                  top: "110%",
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "8px",
                  minWidth: "180px",
                  zIndex: 30,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      style: { display: "block", width: "100%", background: "transparent", border: "none", color: "#fff", padding: "8px 10px", cursor: "pointer", textAlign: "right" },
                      onClick: () => {
                        setShowMore(false);
                        navigate(`/groups/${groupId}/chat`);
                      },
                      children: "💬 فتح الدردشة"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      style: { display: "block", width: "100%", background: "transparent", border: "none", color: "#fff", padding: "8px 10px", cursor: "pointer", textAlign: "right" },
                      onClick: () => {
                        setShowMore(false);
                        navigator.clipboard.writeText(String(groupId));
                        pushToast?.({ type: "success", title: "تم", description: "تم نسخ معرّف المجموعة" });
                      },
                      children: "🔖 نسخ معرّف المجموعة"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      style: { display: "block", width: "100%", background: "transparent", border: "none", color: "#fff", padding: "8px 10px", cursor: "pointer", textAlign: "right" },
                      onClick: () => {
                        setShowMore(false);
                        handleNewInvite();
                      },
                      children: "🔄 تجديد رابط الدعوة"
                    }
                  )
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-group-info-card", children: [
          groupInfo.cover_image_url && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                width: "100%",
                height: "120px",
                borderRadius: "12px",
                backgroundImage: `url(${groupInfo.cover_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                marginBottom: "12px"
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-info-main", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-group-avatar-wrap", children: groupInfo.image_url && String(groupInfo.image_url).startsWith("http") ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: groupInfo.image_url, alt: groupInfo.name, style: { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🚀" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-details", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-name-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { children: [
                  groupInfo.name,
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#8b5cf6", fontSize: "16px" }, children: "✔️" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-active-now", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-active-dot-pulse" }),
                  "نشط الآن"
                ] })
              ] }),
              groupInfo.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-group-bio", children: groupInfo.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-stats-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-stat-item", children: [
                  "👥 ",
                  groupInfo.membersCount,
                  " عضو"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-stat-item", children: [
                  "📅 تم الإنشاء ",
                  groupInfo.createdAt
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-quick-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "yam-action-btn", onClick: handleEditInfo, disabled: uploading, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#8b5cf6" }, children: "✏️" }),
              " تعديل المعلومات"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "yam-action-btn", onClick: handleChangeAvatar, disabled: uploading, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#8b5cf6" }, children: "🖼️" }),
              " ",
              uploading ? "جاري الرفع..." : "تغيير الصورة"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "yam-action-btn", onClick: handleChangeCover, disabled: uploading, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#8b5cf6" }, children: "🌅" }),
              " تغيير الغلاف"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-settings-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-section-title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "🔗 رابط المجموعة" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-link-qr-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-link-display", children: inviteLink }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-qr-box", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: qrSrc, alt: "QR Code" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-link-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yam-link-btn primary", onClick: handleCopyLink, children: "📋 نسخ الرابط" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yam-link-btn secondary", onClick: handleShareLink, children: "🔗 مشاركة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yam-link-btn secondary", onClick: handleNewInvite, children: "🔄 إنشاء رابط جديد" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-settings-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-settings-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-section-title", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "👥 إدارة الأعضاء" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  style: { background: "#6d28d9", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "10px", fontSize: "12px", cursor: "pointer" },
                  onClick: handleAddMember,
                  children: "+ إضافة عضو"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "relative", marginBottom: "15px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                placeholder: "ابحث عن مستخدم...",
                value: searchMember,
                onChange: (e) => setSearchMember(e.target.value),
                dir: "rtl",
                style: { width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px 15px", color: "#fff" }
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-members-list", children: filteredMembers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "20px", color: "#64748b" }, children: "لا يوجد أعضاء حالياً" }) : filteredMembers.map((member) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-member-item", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-member-info", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-member-avatar", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: member.avatar, alt: member.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-member-online" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-member-name", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: member.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: member.username })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-member-actions", children: [
                member.role === "owner" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-badge admin", style: { borderColor: "#f59e0b", color: "#f59e0b", background: "rgba(245,158,11,0.1)" }, children: "المالك" }),
                member.role === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-badge admin", children: "مشرف" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: { background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "0 5px" }, onClick: () => handleEditMember(member.id, "demote"), children: "خفض" })
                ] }),
                (member.role === "mod" || member.role === "moderator") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-badge admin", style: { borderColor: "#10b981", color: "#10b981", background: "rgba(16,185,129,0.1)" }, children: "مراقب" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: { background: "none", border: "none", color: "#10b981", cursor: "pointer", padding: "0 5px" }, onClick: () => handleEditMember(member.id, "promote"), children: "ترقية" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: { background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "0 5px" }, onClick: () => handleEditMember(member.id, "demote"), children: "خفض" })
                ] }),
                member.role === "member" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: { background: "none", border: "none", color: "#10b981", cursor: "pointer", padding: "0 5px" }, onClick: () => handleEditMember(member.id, "promote"), children: "ترقية" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0 5px" }, onClick: () => handleEditMember(member.id, "remove"), children: "إزالة" })
                ] }),
                member.role !== "owner" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { title: "نقل الملكية", style: { background: "none", border: "none", color: "#f59e0b", cursor: "pointer", padding: "0 5px" }, onClick: () => handleEditMember(member.id, "transfer"), children: "👑" })
              ] })
            ] }, member.id)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-settings-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-section-title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "🛡️ الصلاحيات" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-permissions-list", children: [
              { label: "السماح بالنشر", key: "canPost" },
              { label: "السماح بالتعليقات", key: "canComment" },
              { label: "السماح برفع الملفات", key: "canUpload" },
              { label: "السماح بالبث المباشر", key: "canLive" },
              { label: "الموافقة المسبقة على المنشورات", key: "requireApproval" },
              { label: "منع الروابط الخارجية", key: "blockExternalLinks" }
            ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-permission-item", onClick: () => togglePermission(item.key), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-permission-label", children: item.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-checkbox ${permissions[item.key] ? "checked" : ""}`, children: permissions[item.key] && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px" }, children: "✔️" }) })
            ] }, item.key)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                style: { width: "100%", marginTop: "15px", padding: "10px", background: "#6d28d9", border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer" },
                onClick: handleSavePermissions,
                disabled: saving,
                children: saving ? "جاري الحفظ..." : "حفظ الصلاحيات"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-settings-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-settings-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-section-title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "🔒 الخصوصية" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-privacy-options", children: [
              { id: "public", label: "عامة" },
              { id: "private", label: "خاصة" },
              { id: "invite", label: "بالدعوة فقط" }
            ].map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-privacy-item", onClick: () => setPrivacy(opt.id), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-permission-label", children: opt.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-radio ${privacy === opt.id ? "selected" : ""}`, children: privacy === opt.id && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-radio-inner" }) })
            ] }, opt.id)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                style: { width: "100%", marginTop: "15px", padding: "10px", background: "#6d28d9", border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer" },
                onClick: handleSavePrivacy,
                disabled: saving,
                children: saving ? "جاري الحفظ..." : "حفظ الخصوصية"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-settings-section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-section-title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "📊 الإحصائيات" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stats-grid", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-stat-val", children: groupInfo.membersCount }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-stat-label", children: "👥 الأعضاء" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-stat-val", children: stats.posts }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-stat-label", children: "📝 المنشورات" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-stat-val", children: stats.comments }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-stat-label", children: "💬 التعليقات" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-stat-val", children: stats.activity }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-stat-label", children: "🔥 النشاط" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-settings-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-section-title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "⚙️ إدارة متقدمة" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-advanced-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "yam-adv-btn", onClick: handleTransferOwnershipPrompt, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "نقل الملكية" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "👤" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "yam-adv-btn", onClick: handleArchiveGroup, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "أرشفة المجموعة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "📦" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "yam-adv-btn delete", onClick: handleDeleteGroup, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "حذف المجموعة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🗑️" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "40px" } })
      ]
    }
  ) });
};
export {
  GroupSettings as default
};
